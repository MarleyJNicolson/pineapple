<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { urlStore } from '~/store/urlStore';
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: '--key-',
    organization: "--key-",
    project: "--key-",
    dangerouslyAllowBrowser: true,
});

async function main() {
    const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say this is a test" }],
        stream: true,
    });
    for await (const chunk of stream) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
}

main();

// const items = [
//     [{ label: 'Profile'}],
//     [{ label: 'Profile'}]
const route = useRoute();
const depRoute = route.params.department;
const newService = ref();
const depID = ref();
const selectedService = ref();
const selectedServiceID = ref();
const items = ref([]);
const tasks = ref();
const projectData = ref();
const projectID = ref();
const points = ref([1, 2, 3, 5, 8, 13, 21]);
const hourlyRate = ref(42);
const inputHoursPerDay = ref(8);
const inputDaysPerWeek = ref(4);

const hoursPerDay = inputHoursPerDay.value; // incase i got this wrong
// this is hours worked by day * by the number of days worked
const time = ref({
  1: { low: 1, high: hoursPerDay },
  2: { low: hoursPerDay, high: hoursPerDay * 2 },
  3: { low: hoursPerDay * 2, high: hoursPerDay * 5 },
  5: { low: hoursPerDay * 5, high: hoursPerDay * 8 },
  8: { low: hoursPerDay * 8, high: hoursPerDay * 13 },
  13: { low: hoursPerDay * 13, high: hoursPerDay * 21 },
  21: { low: hoursPerDay * 21, high: hoursPerDay * 34 },
});

const finalHigh = ref();
const finalLow = ref();
const activeTasks = ref([]);

async function getIDProject() {
  try {
    const response = await fetch(urlStore.state.url + '/api/projects');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    projectData.value = data.data.map(project => ({
      id: project.id,
      name: project.attributes.name,
    }));

    const matchedProject = projectData.value.find(project => {
      return project.name && (project.name.toLowerCase() === route.params.page.toLowerCase());
    });

    if (matchedProject) {
      projectID.value = matchedProject.id;
      console.log(projectID.value, 'project ID matched')
      await getExistingClientData();
      await getExistingClientRates();
    } else {
      console.log('No matching project found');
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
  }
}
getIDProject();

async function getExistingClientData() {
  try {
    const response = await fetch(urlStore.state.url + '/api/projects/' + projectID.value );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const existingData = Object.values(data.data.attributes.save_calculation);
    activeTasks.value = existingData;
    calculateCost();

  } catch (error) {
    console.error('Error fetching project data:', error);
  }
}

async function getExistingClientRates() {
  try {
    const response = await fetch(urlStore.state.url + '/api/projects/' + projectID.value );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const existingRates = data.data.attributes.save_rates;
    console.log(existingRates)
    hourlyRate.value = data.data.attributes.save_rates.hourlyRate;
    inputHoursPerDay.value = data.data.attributes.save_rates.hoursPerDay;
    inputDaysPerWeek.value = data.data.attributes.save_rates.daysPerWeek;

  } catch (error) {
    console.error('Error fetching project data:', error);
  }
}

async function fetchDepartments() {
  try {
    const response = await fetch(
        urlStore.state.url + "/api/departments?filters[name][$eq]=" + depRoute, 
        {
          headers: {
                    "Content-Type": "application/json",
                    'ngrok-skip-browser-warning': 'true',
          },
        }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let data = await response.json(); // Parse the JSON of the response
    depID.value = data.data[0].id;

    await fetchServices();
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
}
fetchDepartments();

async function fetchServices() {
  try {
    const response = await fetch(
        urlStore.state.url + "/api/services?filters[department][id][$eq]=" + depID.value, {
          headers: {
            "Content-Type": "application/json",
            'ngrok-skip-browser-warning': 'true',
          },
        }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let serviceData = await response.json(); // Parse the JSON of the response
    items.value = [];
    console.log("dasdsta", serviceData);
    serviceData.data.forEach((element) => {
      items.value.push([
        {
          label: element.attributes.name,
          click: () => {
            (selectedService.value = element.attributes.name),
              (selectedServiceID.value = element.id),
              fetchTasks();
          },
        },
      ]);
    });
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
}

async function createNewService() {
  try {
    const response = await fetch(urlStore.state.url + "/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ data: { name: newService.value, department: depID.value } }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    // Optionally, handle response data here
    fetchServices();
    console.log("Department created successfully");
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
    return; // Exit the function if there's an error
  }
}

async function fetchTasks() {
  try {
    const response = await fetch(
        urlStore.state.url + "/api/tasks?filters[department][id][$eq]=" +
        depID.value +
        "&filters[service][id][$eq]=" +
        selectedServiceID.value +
        "&pagination[limit]=-1",
        {
          headers: {
              "Content-Type": "application/json",
              'ngrok-skip-browser-warning': 'true',
          },
        }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json(); // Parse the JSON of the response
    // alert( selectedServiceID.value );
    console.log(data);
    tasks.value = [];

    data.data.forEach((element) => {
      console.log("elm", element.id);
      tasks.value.push({
        name: element.attributes.name,
        taskPoints: element.attributes.points,
        id: element.id,
      });
    });
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
  console.log("task.value", tasks.value);
}

const calculateCost = function () {
  let lowValue = 0;
  let highValue = 0;
  let avgValue = 0;

  activeTasks.value.forEach((element) => {
    lowValue = lowValue + time.value[element.points].low;
    highValue = highValue + time.value[element.points].high;
  });

  finalHigh.value = highValue;
  finalLow.value = lowValue;
};

const scopeTask = function (item) {
  activeTasks.value.push(item);
  saveCalculation(activeTasks);
  calculateCost();
  console.log(activeTasks.value);
};

async function saveCalculation(item) {
  try {
    const response = await fetch(urlStore.state.url + "/api/projects/" + projectID.value);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    function convertArrayToObject(arr) {
      const result = {};

      arr.value.forEach((item, index) => {
        const key = `item${index + 1}`;
        
        result[`${key}`] = {}
        
        // Iterate through the keys of the item object
        Object.entries(item).forEach(([itemKey, itemValue]) => {
          result[`${key}`][`${itemKey}`] = itemValue;
        });
      });

      return result;
    }

    const convertedObject = convertArrayToObject(item);
    console.log(convertedObject, 'converted data')

    const updatedData = JSON.parse(`{
      "data": {
        "save_calculation": ${JSON.stringify(convertedObject)}
      }
    }`);

    console.log(updatedData, 'updatedData to be sent');

    const updateResponse = await fetch(urlStore.state.url + "/api/projects/" + projectID.value, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!updateResponse.ok) {
      throw new Error("Failed to update the project");
    }

    const updatedProject = await updateResponse.json();
    console.log("Updated project data:", updatedProject);

  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
};

async function saveRates(value, field) {
  switch (field) {
    case 'hourlyRate':
      hourlyRate.value = value;
      break;
    case 'inputDaysPerWeek':
      inputDaysPerWeek.value = value;
      break;
    case 'inputHoursPerDay':
      inputHoursPerDay.value  = value;
      break;
    default:
      break;
  }

  const rates = {
    hourlyRate: hourlyRate.value,
    daysPerWeek: inputDaysPerWeek.value,
    hoursPerDay: inputHoursPerDay.value
  };

  try {
    const response = await fetch(urlStore.state.url + "/api/projects/" + projectID.value);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();


    const updatedData = JSON.parse(`{
      "data": {
        "save_rates": ${JSON.stringify(rates)}
      }
    }`);

    console.log(updatedData, 'updatedData to be sent');

    const updateResponse = await fetch(urlStore.state.url + "/api/projects/" + projectID.value, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!updateResponse.ok) {
      throw new Error("Failed to update the project");
    }

    const updatedProject = await updateResponse.json();
    console.log("Updated project data:", updatedProject);

  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
}

function convertWorkingHours(hours) {
  // Constants
  const hoursInWorkDay = inputHoursPerDay.value;
  const workDaysInWeek = inputDaysPerWeek.value;

  const workDaysInMonth = workDaysInWeek * 4.33;

  let workDays = hours / hoursInWorkDay;

  let months = Math.floor(workDays / workDaysInMonth);
  workDays -= months * workDaysInMonth;

  let weeks = Math.floor(workDays / workDaysInWeek);
  workDays -= weeks * workDaysInWeek;

  workDays = Math.floor(workDays);

  // Result
  return { months, weeks, days: workDays };
}

function getAverage(num1, num2) {
  return (num1 + num2) / 2;
}

function removeTask(index) {
  activeTasks.value.splice(index, 1);
  saveCalculation(activeTasks);
  calculateCost();
}
</script>

<template>
  <div class="dashboard">
    <div class="selection-stepper">
      <div class="selection-stepper__left">
        <h1>
          <span>Client:</span> {{ route.params.page }} <br />
          <span> department:</span> {{ route.params.department }}
        </h1>
        <div class="selection-stepper__item">
          <div class="option">
            <p>Select Service</p>
            <UDropdown class="dropdown" :items="items" :popper="{ arrow: true }">
              <UButton
                v-if="selectedService"
                color="white"
                :label="selectedService"
                trailing-icon="i-heroicons-chevron-down-20-solid"
              />
              <UButton
                v-else
                color="white"
                label="Service"
                trailing-icon="i-heroicons-chevron-down-20-solid"
              />
            </UDropdown>
          </div>
          <p>- OR -</p>
          <div class="option option-row">
            <div class="option__inside">
              <p>New Service</p>
              <UInput v-model="newService" />
            </div>
            <UButton v-on:click="createNewService">Add Service</UButton>
          </div>
        </div>
      </div>
      <div class="added-task">
        <taskCard
          v-for="(item, index) in activeTasks"
          :taskName="item.name"
          v-on:taskRemove="removeTask(index)"
          :taskPoints="item.points"
          :addedCards="true"
        />
      </div>
      <div class="option option-col" v-show="activeTasks.length > 0">
        <div class="option__inside hourly-rate">
          <p>hourly rate</p>
          <UInput @input="(event) => saveRates(event.target.value, 'hourlyRate')" v-model="hourlyRate" />
        </div>
        <div class="option__inside hourly-rate">
          <p>days per week</p>
          <UInput @input="(event) => saveRates(event.target.value, 'inputDaysPerWeek')" v-model="inputDaysPerWeek" />
        </div>
        <div class="option__inside hourly-rate">
          <p>hours per day</p>
          <UInput @input="(event) => saveRates(event.target.value, 'inputHoursPerDay')" v-model="inputHoursPerDay" />
        </div>
      </div>
      <div class="results-container" v-show="activeTasks.length > 0">
        <div class="results-container__col">
          <div class="results results-high">
            <h3>High</h3>
            <p>£{{ finalHigh * hourlyRate }}</p>
            <p>{{ finalHigh }} hours</p>
            <p v-if="convertWorkingHours(finalHigh).months">
              {{ convertWorkingHours(finalHigh).months }} months
            </p>
            <p v-if="convertWorkingHours(finalHigh).weeks">
              {{ convertWorkingHours(finalHigh).weeks }} weeks
            </p>
            <p v-if="convertWorkingHours(finalHigh).days">
              {{ convertWorkingHours(finalHigh).days }} days
            </p>
          </div>

          <div class="results results-low">
            <h3>Low</h3>
            <p>£{{ finalLow * hourlyRate }}</p>
            <p>{{ finalLow }} hours</p>
            <p v-if="convertWorkingHours(finalLow).months">
              {{ convertWorkingHours(finalLow).months }} months
            </p>
            <p v-if="convertWorkingHours(finalLow).weeks">
              {{ convertWorkingHours(finalLow).weeks }} weeks
            </p>
            <p v-if="convertWorkingHours(finalLow).days">
              {{ convertWorkingHours(finalLow).days }} days
            </p>
          </div>
        </div>
        <div class="results results-avg">
          <h3>Avg</h3>
          <p>£{{ getAverage(finalLow, finalHigh) * hourlyRate }}</p>
          <p>{{ getAverage(finalLow, finalHigh) }} hours</p>
          <p v-if="convertWorkingHours(getAverage(finalLow, finalHigh)).months">
            {{ convertWorkingHours(getAverage(finalLow, finalHigh)).months }} months
          </p>
          <p v-if="convertWorkingHours(getAverage(finalLow, finalHigh)).weeks">
            {{ convertWorkingHours(getAverage(finalLow, finalHigh)).weeks }} weeks
          </p>
          <p v-if="convertWorkingHours(getAverage(finalLow, finalHigh)).days">
            {{ convertWorkingHours(getAverage(finalLow, finalHigh)).days }} days
          </p>
        </div>
      </div>
    </div>
    <div class="points">
        <div class="points-item" v-for="(item, index) in points" >
            <p><span>{{ item }}</span> Points</p> 
            <!-- <p>{{ convertWorkingHours(time[item].low).days }}Days {{ convertWorkingHours(time[item].low).weeks }}Weeks {{ convertWorkingHours(time[item].low).months }}Months</p>
            <p>{{ convertWorkingHours(time[item].high).days }}Days {{ convertWorkingHours(time[item].high).weeks }}Weeks {{ convertWorkingHours(time[item].high).months }}Months</p> -->
            <!-- <p>{{ convertWorkingHours(time[item].high).days }}</p> -->
            <p v-if="index == 0">1hour - 1day</p>
            <p v-if="index == 1">1 - 2days</p>
            <p v-if="index == 2">2 - 5 Days</p>
            <p v-if="index == 3">5 - 8 Days</p>
            <p v-if="index == 4">8 - 13 Days</p>
            <p v-if="index == 5">13 - 21 Days</p>
            <p v-if="index == 6">21 - 34+ Days</p>
        </div>
    </div>
    <div class="task-board">
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[0]"
        />
        <!-- should have just made one task prop -->
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[0]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[1]"
        />
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[1]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[2]"
        />
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[2]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[3]"
        />
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[3]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[4]"
        />
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[4]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[5]"
        />
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[5]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
      <div class="task-board__column">
        <addTask
          :department="depID"
          :service="selectedServiceID"
          v-on:taskAdded="fetchTasks"
          :points="points[6]"
        />
        <div class="task-board__column-scroll">
          <taskCard
            v-for="(item, index) in tasks"
            v-on:taskDeleted="fetchTasks()"
            :taskID="item.id"
            :taskName="item.name"
            :taskPoints="item.taskPoints"
            :columnPoints="points[6]"
            v-on:taskClicked="scopeTask({ name: item.name, points: item.taskPoints })"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "~/assets/scss/page.scss";
</style>
