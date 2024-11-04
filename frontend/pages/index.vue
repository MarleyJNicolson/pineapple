<script setup lang="ts">
import { ref } from 'vue';
import { urlStore } from '~/store/urlStore';
    // const items = [
    //     [{ label: 'Profile'}],
    //     [{ label: 'Profile'}]
    // ];
    const items = ref([]);
    const newDepartment = ref();
    const newProject = ref();
    const selectedDepartment = ref(false);
    const projectsList = ref([]);
    console.log('apiURL', urlStore.state.url );
    async function fetchDepartments() {
        try {
            const response = await fetch( urlStore.state.url + '/api/departments', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    'ngrok-skip-browser-warning': 'true'
                }
            });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); // Parse the JSON of the response
        items.value = [];
        data.data.forEach(element => {
            console.log('elm',element);
            items.value.push([{label: element.attributes.name ,  click: () => { selectedDepartment.value = element.attributes.name } }])
        });

        console.log('data', data.data);
      
        } catch (error) {
            console.error('There was a problem with your fetch operation:', error);
        }
    }
    fetchDepartments();
    async function createNewDepartment() {
        try {
            const response = await fetch(  urlStore.state.url + '/api/departments', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ "data": { "name": newDepartment.value } }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Optionally, handle response data here
            console.log("Department created successfully");
        } catch (error) {
            console.error('There was a problem with your fetch operation:', error);
            return; // Exit the function if there's an error
        }
        // Call fetchDepartments after the department creation succeeds
        await fetchDepartments();
        selectedDepartment.value = newDepartment.value;
    };

    async function addProject(){
        try {
            const response = await fetch( urlStore.state.url + '/api/projects', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ "data": { "name": newProject.value, 'isDepartment' : selectedDepartment.value } }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Optionally, handle response data here
            await fetchProjects();
            console.log("Department created successfully");
        } catch (error) {
            console.error('There was a problem with your fetch operation:', error);
            return; // Exit the function if there's an error
        }
    }

    async function fetchProjects() {
        try {
            const response = await fetch( urlStore.state.url + '/api/projects?populate=deep,10', {
                headers: {
                    "Content-Type": "application/json",
                    'ngrok-skip-browser-warning': 'true',
                },
            } );

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); // Parse the JSON of the response
        projectsList.value = [];
        data.data.forEach(element => {
            projectsList.value.push({ name: element.attributes.name, dep: element.attributes.isDepartment });
        });

        console.log('data', data.data);
      
        } catch (error) {
            console.error('There was a problem with your fetch operation:', error);
        }
    }
    fetchProjects();
    const filteredProjects = computed(() => {
        if(selectedDepartment.value){
            return projectsList.value.filter(item => item.dep === selectedDepartment.value);
        }else{
            return [];
        }
        
    });
</script>

<template>
    <div class="dashboard"> 
        <div class="selection-stepper">
            <div class="selection-stepper__item">   
                <div class="option">
                    <p>Select Department</p> 
                    <UDropdown class="dropdown"  :items="items" :popper="{ arrow: true }">
                        <UButton v-if="selectedDepartment" color="white" :label="selectedDepartment" trailing-icon="i-heroicons-chevron-down-20-solid" />
                        <UButton v-else color="white" label="Department" trailing-icon="i-heroicons-chevron-down-20-solid" />
                    </UDropdown>
                </div>
                <p>- OR -</p>
                <div class="option option-row">
                    <div class="option__inside">
                        <p>New Department</p>
                        <UInput v-model="newDepartment" />
                    </div>
                    <UButton v-on:click="createNewDepartment" >Add Department</UButton>
                </div>
            </div>

            <!-- <div class="selection-stepper__item">   
                 
                 <p>Select Department</p> 
                 <UDropdown class="dropdown" :items="items" :popper="{ arrow: true }">
                 <UButton color="white" label="Options" trailing-icon="i-heroicons-chevron-down-20-solid" />
                 </UDropdown>
 
                 <p>New Department</p>
                 <UInput v-model="newDepartment" />
                 <UButton v-on:click="creatNewDepartment" >Add Department</UButton>
 
            </div> -->

        </div>
        <div class="project-container" v-if="selectedDepartment">
            <p>New Project</p>
            <div class="add-client" >
                <UInput v-if="selectedDepartment" v-model="newProject" />
                <UButton v-if="selectedDepartment" v-on:click="addProject" >Add Project</UButton>
            </div>

            <div class="project-list">
                <div class="project-list__item" v-for="(item, index) in filteredProjects">
                    <p>{{ item.name }}</p> <UButton v-if="selectedDepartment" :to="'/' + selectedDepartment + '/' + item.name ">View Project</UButton>
                </div>
            </div>

        </div>
    </div>
</template>

<style lang="scss">
    @use "~/assets/scss/dashboard.scss";
</style>