
import pool from '../config/database';

interface PopulationData {
  current_population: number;
  today_births: number;
  today_deaths: number;
  today_net: number;
  year_births: number;
  year_deaths: number;
  year_net: number;
}

const INITIAL_POPULATION = 8390000000;
const BIRTH_RATE_PER_SECOND = 4.3;
const DEATH_RATE_PER_SECOND = 1.8;

export class PopulationService {
  private currentData: PopulationData = {
    current_population: INITIAL_POPULATION,
    today_births: 0,
    today_deaths: 0,
    today_net: 0,
    year_births: 0,
    year_deaths: 0,
    year_net: 0
  };

  constructor() {
    this.loadFromDatabase();
  }

  async loadFromDatabase() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM earth_data ORDER BY recorded_at DESC LIMIT 1'
      );
      if (rows.length > 0) {
        this.currentData = (rows as PopulationData[])[0];
      }
    } catch (error) {
      console.error('Failed to load population data:', error);
    }
  }

  async saveToDatabase() {
    try {
      await pool.execute(
        `INSERT INTO earth_data 
         (current_population, today_births, today_deaths, today_net, year_births, year_deaths, year_net) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          this.currentData.current_population,
          this.currentData.today_births,
          this.currentData.today_deaths,
          this.currentData.today_net,
          this.currentData.year_births,
          this.currentData.year_deaths,
          this.currentData.year_net
        ]
      );
    } catch (error) {
      console.error('Failed to save population data:', error);
    }
  }

  updatePopulation() {
    const netChange = Math.floor(BIRTH_RATE_PER_SECOND - DEATH_RATE_PER_SECOND);
    this.currentData.current_population += netChange;
    this.currentData.today_births += Math.floor(BIRTH_RATE_PER_SECOND);
    this.currentData.today_deaths += Math.floor(DEATH_RATE_PER_SECOND);
    this.currentData.today_net = this.currentData.today_births - this.currentData.today_deaths;
    this.currentData.year_births += Math.floor(BIRTH_RATE_PER_SECOND);
    this.currentData.year_deaths += Math.floor(DEATH_RATE_PER_SECOND);
    this.currentData.year_net = this.currentData.year_births - this.currentData.year_deaths;
  }

  getCurrentData(): PopulationData {
    return { ...this.currentData };
  }

  resetDaily() {
    this.currentData.today_births = 0;
    this.currentData.today_deaths = 0;
    this.currentData.today_net = 0;
  }

  resetYearly() {
    this.currentData.year_births = 0;
    this.currentData.year_deaths = 0;
    this.currentData.year_net = 0;
  }

  simulateBirth() {
    this.currentData.current_population += 1;
    this.currentData.today_births += 1;
    this.currentData.today_net += 1;
    this.currentData.year_births += 1;
    this.currentData.year_net += 1;
  }

  simulateDeath() {
    this.currentData.current_population -= 1;
    this.currentData.today_deaths += 1;
    this.currentData.today_net -= 1;
    this.currentData.year_deaths += 1;
    this.currentData.year_net -= 1;
  }
}

export const populationService = new PopulationService();
