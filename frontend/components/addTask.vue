<script setup lang="ts">
import { Icon } from "@iconify/vue";
const active = ref("hide");
const taskName = ref();
const emit = defineEmits(["taskAdded"]);
var inputActive = function () {
  if (active.value == "hide") {
    active.value = "active";
  } else {
    active.value = "hide";
  }
};
const props = defineProps({
  service: Number,
  department: Number,
  points: Number,
});

async function createTask() {
  try {
    const response = await fetch("http://localhost:1337/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          name: taskName.value,
          service: props.service,
          department: props.department,
          points: props.points,
        },
      }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    // Optionally, handle response data here
    console.log("Department created successfully");
    emit('taskAdded')
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
    return; // Exit the function if there's an error
  }
}

</script>

<template>
  <div class="add-task">
    <Icon icon="ic:baseline-add-circle-outline" v-on:click="inputActive" />
    <div class="hide-input" :class="active">
      <UInput
        color="primary"
        v-model="taskName"
        variant="outline"
        placeholder="Search..."
      />
      <UButton v-on:click="createTask">Add</UButton>
    </div>
  </div>
</template>

<style lang="scss">
@use "~/assets/scss/add-task.scss";
</style>
