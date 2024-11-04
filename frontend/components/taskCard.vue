<script setup lang="ts">
    const props = defineProps({
        taskName: String,
        taskPoints: Number,
        columnPoints: Number,
        addedCards: Boolean,
        taskID: Number
    });
    const emit = defineEmits(["taskClicked","taskDeleted",'taskRemove']);
    
    async function deleteItem() {
        try {
        const response = await fetch(`http://localhost:1337/api/tasks/${props.taskID}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            // Include authorization header if your Strapi setup requires authentication
            // 'Authorization': 'Bearer YOUR_JWT_TOKEN',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Handle the successful deletion here, maybe refresh the list or show a success message
        emit('taskDeleted');
        } catch (error) {
        console.error('Error deleting the item:', error);
        }
    }

</script>

<template>
    <div class="task-card added" v-on:click="emit('taskRemove')" :class="'task-card-' + taskPoints" v-if="addedCards">
        <p>{{ props.taskName }}</p>
    </div>
    <div class="task-card" v-if="props.taskPoints == props.columnPoints" >
        <p v-on:click="emit('taskClicked')">{{ props.taskName }}</p> <svg v-on:click="deleteItem()" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 2048 2048"><path fill="currentColor" d="M1792 384h-128v1472q0 40-15 75t-41 61t-61 41t-75 15H448q-40 0-75-15t-61-41t-41-61t-15-75V384H128V256h512V128q0-27 10-50t27-40t41-28t50-10h384q27 0 50 10t40 27t28 41t10 50v128h512zM768 256h384V128H768zm768 128H384v1472q0 26 19 45t45 19h1024q26 0 45-19t19-45zM768 1664H640V640h128zm256 0H896V640h128zm256 0h-128V640h128z"/></svg>
    </div>
</template>

<style lang="scss">
    @use "~/assets/scss/taskCard.scss";
</style>

