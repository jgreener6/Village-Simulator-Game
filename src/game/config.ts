import fieldImage from '../assets/images/field.webp';
import houseImage from '../assets/images/house.webp';
import lumberMillImage from '../assets/images/lumberMill.webp';
import pastureImage from '../assets/images/pasture.webp';
import wellImage from '../assets/images/well.webp';
import type { ImprovementType, ResourceAmounts, ResourceType, Resources } from './types';

export const GRID_SIZE = 5;
export const MAX_LEVEL = 3;
export const POPULATION_GOAL = 75;
/** Each villager eats this much grain and drinks this much water per day. */
export const UPKEEP_PER_PERSON = 0.5;
export const MAX_LOG_ENTRIES = 50;

export const STARTING_RESOURCES: Resources = {
  lumber: 5,
  grain: 5,
  water: 5,
  sheep: 1,
  people: 0,
};

export const RESOURCE_TYPES: ResourceType[] = ['people', 'grain', 'water', 'lumber', 'sheep'];

export const RESOURCES: Record<ResourceType, { label: string; icon: string }> = {
  people: { label: 'People', icon: '🧑‍🌾' },
  grain: { label: 'Grain', icon: '🌾' },
  water: { label: 'Water', icon: '💧' },
  lumber: { label: 'Lumber', icon: '🪵' },
  sheep: { label: 'Sheep', icon: '🐑' },
};

export interface ImprovementDefinition {
  label: string;
  /** Illustration URL, shown on the map and in menus. */
  image: string;
  description: string;
  /** costs[n] is the price of reaching level n + 1. */
  costs: ResourceAmounts[];
  /** Daily output; amounts[n] is the total produced at level n + 1. */
  produces?: { resource: ResourceType; amounts: number[] };
  /** housing[n] is the number of villagers who move in on reaching level n + 1. */
  housing?: number[];
}

const workerCosts = (base: ResourceAmounts = {}): ResourceAmounts[] => [
  { people: 1, ...base },
  { people: 1, lumber: 5 },
  { people: 1, lumber: 10, sheep: 2 },
];

export const IMPROVEMENTS: Record<ImprovementType, ImprovementDefinition> = {
  house: {
    label: 'House',
    image: houseImage,
    description: 'Shelter that attracts new villagers to your settlement.',
    costs: [
      { lumber: 5, grain: 3, water: 3 },
      { lumber: 10, grain: 6, water: 6, sheep: 2 },
      { lumber: 20, grain: 10, water: 10, sheep: 5 },
    ],
    housing: [5, 5, 10],
  },
  field: {
    label: 'Field',
    image: fieldImage,
    description: 'Farmland worked by one villager per level. Grows grain.',
    costs: workerCosts(),
    produces: { resource: 'grain', amounts: [4, 8, 14] },
  },
  well: {
    label: 'Well',
    image: wellImage,
    description: 'Draws fresh water each day. Staffed by one villager per level.',
    costs: workerCosts(),
    produces: { resource: 'water', amounts: [4, 8, 14] },
  },
  lumberMill: {
    label: 'Lumber Mill',
    image: lumberMillImage,
    description: 'Fells and saws timber for construction.',
    costs: workerCosts(),
    produces: { resource: 'lumber', amounts: [3, 6, 10] },
  },
  pasture: {
    label: 'Pasture',
    image: pastureImage,
    description: 'Raises sheep, needed for advanced upgrades.',
    costs: [
      { people: 1, grain: 2 },
      { people: 1, lumber: 5, grain: 5 },
      { people: 1, lumber: 10, grain: 10 },
    ],
    produces: { resource: 'sheep', amounts: [1, 2, 4] },
  },
};

export const IMPROVEMENT_TYPES = Object.keys(IMPROVEMENTS) as ImprovementType[];
