import { useState } from "react";
import { Improvement, Resource } from "../../../models/Improvement";
import { ImprovementCosts } from "../../../store/ImprovementsCost";

export function EditImprovementDialog(props: {
  improvement: Improvement;
  resources: Resource[];
  setResources: any;
  onClose: () => void;
  onUpgrade: () => void;
  onDowngrade: () => void;
  onRemove: () => void;
}) {
  const [level, setLevel] = useState(props.improvement.level); // State for the improvement level
  const [resourceAmount, setResourceAmount] = useState<number>(
    props.improvement.resourceProduced?.amount || 0
  ); // State for the resource amount produced by the improvement

  
  const [upgradeDisabled, setUpgradeDisabled] = useState<boolean>(false)
  const [downgradeDisabled, setDowngradeDisabled] =useState<boolean>(false)
  const upgradeImprovement = () => {
    setUpgradeDisabled(false)
    const enoughResources = props.improvement.cost.every((cost) => {
      const matchingResource = props.resources.find((resource) => resource.type === cost.type);
      
      return matchingResource && matchingResource.amount >= cost.amount;
      
      
    });

    if (!enoughResources) {
      setUpgradeDisabled(true)
      console.log('Not enough resources to upgrade improvement');
      return;
    }

    const updatedResources = props.resources.map((resource) => {
      const matchingCost = props.improvement.cost.find((cost) => cost.type === resource.type);
      if (matchingCost) {
        return {
          ...resource,
          amount: resource.amount - matchingCost.amount,
        };
      }
      return resource;
    });

    setLevel((prevLevel) => prevLevel + 1); //increase level

    const addBenefit = props.improvement.resourceProduced?.amount || 0;
    const resourceMatch = updatedResources.find((resource) => resource.type === props.improvement.resourceProduced?.type);
    if (resourceMatch) {
      resourceMatch.amount += addBenefit;
    }

    props.setResources(updatedResources);
    props.onUpgrade();
  };

  const downgradeImprovement = () => {
    if (level === 1) {
      setDowngradeDisabled(true)
      return; // Cannot downgrade below level 1
    }
    const enoughResources = props.improvement.cost.every((cost) => {
      const matchingResource = props.resources.find((resource) => resource.type === cost.type);
      return matchingResource && matchingResource.amount >= cost.amount;
    });

    if (!enoughResources) {
      console.log('Not enough resources to upgrade improvement');
      return;
    }

    const updatedResources = props.resources.map((resource) => {
      const matchingCost = props.improvement.cost.find((cost) => cost.type === resource.type);
      if (matchingCost) {
        return {
          ...resource,
          amount: resource.amount + matchingCost.amount,
        };
      }
      return resource;
    });

    setLevel((prevLevel) => prevLevel - 1); //increase level

    const removeBenefit = props.improvement.resourceProduced?.amount || 0;
    const resourceMatch = updatedResources.find((resource) => resource.type === props.improvement.resourceProduced?.type);
    if (resourceMatch) {
      resourceMatch.amount -= removeBenefit;
    }

    props.setResources(updatedResources);
    props.onDowngrade();
  };

  const removeImprovement = () => {
    props.onRemove(); // Call the onRemove callback provided by the parent component
  };

  return (
    <div>
      <div className="improvement-info">
        <p>Type: {props.improvement.type}</p>
        <p>Level: {level}</p>
        <p>
          Benefit: {resourceAmount} {props.improvement.resourceProduced?.type}
        </p>
        <div>
          Cost:
          {props.improvement.cost.map((cost, index) => (
            <li key={index}>
              {cost.amount} {cost.type}
            </li>
          ))}
        </div>
      </div>
      <div className="buttons-container">
        <button onClick={props.onClose}>Close</button>
        <button onClick={upgradeImprovement} disabled={upgradeDisabled}>Upgrade</button>
        <button onClick={downgradeImprovement} disabled={downgradeDisabled}>Downgrade</button>
        <button onClick={removeImprovement}>Remove</button>
      </div>
    </div>
  );
}

