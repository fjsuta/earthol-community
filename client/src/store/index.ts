
import { defineStore } from 'pinia';
import { ref } from 'vue';

interface PopulationData {
  current_population: number;
  today_births: number;
  today_deaths: number;
  today_net: number;
  year_births: number;
  year_deaths: number;
  year_net: number;
}

export const useEarthStore = defineStore('earth', () => {
  const populationData = ref<PopulationData>({
    current_population: 8390000000,
    today_births: 0,
    today_deaths: 0,
    today_net: 0,
    year_births: 0,
    year_deaths: 0,
    year_net: 0
  });
  
  const regions = ref<any[]>([]);
  const onlineUsers = ref<any[]>([]);
  const birthEvents = ref<any[]>([]);
  const deathEvents = ref<any[]>([]);

  function updatePopulationData(data: PopulationData) {
    populationData.value = data;
  }

  function setRegions(data: any[]) {
    regions.value = data;
  }

  function setOnlineUsers(data: any[]) {
    onlineUsers.value = data;
  }

  function addBirthEvent(event: any) {
    birthEvents.value.push(event);
    if (birthEvents.value.length > 50) {
      birthEvents.value.shift();
    }
  }

  function addDeathEvent(event: any) {
    deathEvents.value.push(event);
    if (deathEvents.value.length > 50) {
      deathEvents.value.shift();
    }
  }

  return {
    populationData,
    regions,
    onlineUsers,
    birthEvents,
    deathEvents,
    updatePopulationData,
    setRegions,
    setOnlineUsers,
    addBirthEvent,
    addDeathEvent
  };
});
