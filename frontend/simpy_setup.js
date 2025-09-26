(function () {
  const selectors = {
    scenarioName: document.getElementById("scenario-name"),
    randomSeed: document.getElementById("random-seed"),
    startTime: document.getElementById("start-time"),
    duration: document.getElementById("duration"),
    durationUnit: document.getElementById("duration-unit"),
    scenarioDescription: document.getElementById("scenario-description"),
    resourceList: document.getElementById("resource-list"),
    processList: document.getElementById("process-list"),
    resourceTemplate: document.getElementById("resource-template"),
    processTemplate: document.getElementById("process-template"),
    stepTemplate: document.getElementById("step-template"),
    resourceDataList: document.getElementById("resource-names"),
    previewButton: document.getElementById("preview-json"),
    downloadButton: document.getElementById("download-json"),
    copyButton: document.getElementById("copy-json"),
    resetButton: document.getElementById("reset-all"),
    previewPane: document.getElementById("json-preview"),
  };

  const defaultData = {
    scenario: {
      name: "矿山运输调度",
      randomSeed: 42,
      startTime: "",
      duration: 480,
      durationUnit: "minutes",
      description: "示例：车辆从采场装载后前往破碎站倾卸，再返回等待区。",
    },
    resources: [
      {
        name: "装载机 A",
        capacity: 1,
        queue: 3,
        priority: "fifo",
        notes: "带有优先维修策略，每 8 小时保养一次。",
      },
      {
        name: "破碎站",
        capacity: 1,
        queue: 5,
        priority: "priority",
        notes: "优先处理来自 1# 采场的矿石。",
      },
    ],
    processes: [
      {
        name: "运输车辆",
        arrivalDistribution: "deterministic",
        arrivalParam1: 12,
        arrivalParam2: "",
        arrivalUnit: "minutes",
        initialEntities: 0,
        notes: "车辆数量固定，由调度系统统一派发。",
        steps: [
          {
            stepName: "等待装载",
            resourceName: "装载机 A",
            seizeAmount: 1,
            durationDistribution: "deterministic",
            durationParam1: 6,
            durationParam2: "",
            durationUnit: "minutes",
            priority: 0,
          },
          {
            stepName: "运输至破碎站",
            resourceName: "",
            seizeAmount: "",
            durationDistribution: "uniform",
            durationParam1: 14,
            durationParam2: 20,
            durationUnit: "minutes",
            priority: 0,
          },
          {
            stepName: "倾卸破碎站",
            resourceName: "破碎站",
            seizeAmount: 1,
            durationDistribution: "deterministic",
            durationParam1: 5,
            durationParam2: "",
            durationUnit: "minutes",
            priority: 1,
          },
        ],
      },
    ],
  };

  const debounce = (fn, wait = 120) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(null, args), wait);
    };
  };

  const updateResourceDatalist = debounce(() => {
    const names = Array.from(
      selectors.resourceList.querySelectorAll('[data-field="name"]')
    )
      .map((input) => input.value.trim())
      .filter(Boolean);
    selectors.resourceDataList.innerHTML = "";
    [...new Set(names)].forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      selectors.resourceDataList.appendChild(option);
    });
  }, 80);

  const fillInput = (input, value) => {
    if (value === undefined || value === null || value === "") return;
    input.value = value;
  };

  function createResourceCard(data = {}) {
    const fragment = selectors.resourceTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".resource-card");
    const removeBtn = card.querySelector('[data-action="remove"]');
    removeBtn.addEventListener("click", () => {
      card.remove();
      updateResourceDatalist();
    });

    card.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.dataset.field;
      fillInput(input, data[key]);
      input.addEventListener("input", updateResourceDatalist);
    });

    selectors.resourceList.appendChild(card);
    updateResourceDatalist();
  }

  function createStepCard(stepData = {}) {
    const fragment = selectors.stepTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".step-card");
    const removeBtn = card.querySelector('[data-action="remove"]');
    removeBtn.addEventListener("click", () => card.remove());

    card.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.dataset.field
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
        .replace(/^([a-z])/, (char) => char.toLowerCase());
      fillInput(input, stepData[key]);
    });

    return card;
  }

  function createProcessCard(processData = {}) {
    const fragment = selectors.processTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".process-card");
    const removeBtn = card.querySelector('[data-action="remove"]');
    const addStepBtn = card.querySelector('[data-action="add-step"]');
    const stepList = card.querySelector(".step-list");

    removeBtn.addEventListener("click", () => card.remove());

    addStepBtn.addEventListener("click", () => {
      const stepCard = createStepCard();
      stepList.appendChild(stepCard);
    });

    card.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.dataset.field
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
        .replace(/^([a-z])/, (char) => char.toLowerCase());
      fillInput(input, processData[key]);
    });

    (processData.steps || []).forEach((step) => {
      const stepCard = createStepCard(step);
      stepList.appendChild(stepCard);
    });

    if (!stepList.children.length) {
      stepList.appendChild(createStepCard());
    }

    selectors.processList.appendChild(card);
  }

  function collectScenarioData() {
    return {
      name: selectors.scenarioName.value.trim(),
      random_seed: selectors.randomSeed.value === "" ? null : Number(selectors.randomSeed.value),
      start_time: selectors.startTime.value || null,
      duration: selectors.duration.value === "" ? null : Number(selectors.duration.value),
      duration_unit: selectors.durationUnit.value,
      description: selectors.scenarioDescription.value.trim(),
    };
  }

  function collectResourceData() {
    return Array.from(selectors.resourceList.querySelectorAll(".resource-card")).map(
      (card) => {
        const pick = (selector) => card.querySelector(selector).value.trim();
        const capacity = card.querySelector('[data-field="capacity"]').value;
        const queue = card.querySelector('[data-field="queue"]').value;
        return {
          name: pick('[data-field="name"]'),
          capacity: capacity === "" ? null : Number(capacity),
          queue_limit: queue === "" ? null : Number(queue),
          priority_rule: card.querySelector('[data-field="priority"]').value,
          notes: pick('[data-field="notes"]'),
        };
      }
    );
  }

  function collectStepData(stepCard) {
    const getValue = (selector) => stepCard.querySelector(selector).value.trim();
    const seize = getValue('[data-field="seize-amount"]');
    const param1 = getValue('[data-field="duration-param1"]');
    const param2 = getValue('[data-field="duration-param2"]');
    const priority = getValue('[data-field="priority"]');

    return {
      name: getValue('[data-field="step-name"]'),
      resource: getValue('[data-field="resource-name"]'),
      seize: seize === "" ? null : Number(seize),
      duration: {
        distribution: getValue('[data-field="duration-distribution"]'),
        parameter_1: param1 === "" ? null : Number(param1),
        parameter_2: param2 === "" ? null : Number(param2),
        unit: getValue('[data-field="duration-unit"]') || null,
      },
      priority: priority === "" ? null : Number(priority),
    };
  }

  function collectProcessData() {
    return Array.from(selectors.processList.querySelectorAll(".process-card")).map(
      (card) => {
        const getValue = (selector) => card.querySelector(selector).value.trim();
        const param1 = getValue('[data-field="arrival-param1"]');
        const param2 = getValue('[data-field="arrival-param2"]');
        const initial = getValue('[data-field="initial-entities"]');

        const stepCards = Array.from(card.querySelectorAll(".step-card"));
        return {
          name: getValue('[data-field="name"]'),
          arrival: {
            distribution: getValue('[data-field="arrival-distribution"]'),
            parameter_1: param1 === "" ? null : Number(param1),
            parameter_2: param2 === "" ? null : Number(param2),
            unit: getValue('[data-field="arrival-unit"]') || null,
          },
          initial_entities: initial === "" ? null : Number(initial),
          notes: getValue('[data-field="notes"]'),
          steps: stepCards.map(collectStepData),
        };
      }
    );
  }

  function buildConfiguration() {
    return {
      scenario: collectScenarioData(),
      resources: collectResourceData(),
      processes: collectProcessData(),
      generated_at: new Date().toISOString(),
    };
  }

  function renderPreview() {
    const data = buildConfiguration();
    selectors.previewPane.textContent = JSON.stringify(data, null, 2);
    return data;
  }

  function downloadJSON() {
    const data = renderPreview();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const scenarioName = selectors.scenarioName.value.trim() || "simpy_scenario";
    link.href = url;
    link.download = `${scenarioName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function copyJSON() {
    try {
      const data = renderPreview();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      selectors.copyButton.textContent = "已复制";
      setTimeout(() => (selectors.copyButton.textContent = "复制到剪贴板"), 1800);
    } catch (error) {
      console.error("复制失败", error);
      selectors.copyButton.textContent = "复制失败";
      setTimeout(() => (selectors.copyButton.textContent = "复制到剪贴板"), 2000);
    }
  }

  function resetToDefault() {
    selectors.resourceList.innerHTML = "";
    selectors.processList.innerHTML = "";

    fillInput(selectors.scenarioName, defaultData.scenario.name);
    fillInput(selectors.randomSeed, defaultData.scenario.randomSeed);
    selectors.startTime.value = defaultData.scenario.startTime;
    fillInput(selectors.duration, defaultData.scenario.duration);
    selectors.durationUnit.value = defaultData.scenario.durationUnit;
    selectors.scenarioDescription.value = defaultData.scenario.description;

    defaultData.resources.forEach(createResourceCard);
    defaultData.processes.forEach(createProcessCard);

    renderPreview();
  }

  function bindEvents() {
    selectors.previewButton.addEventListener("click", renderPreview);
    selectors.downloadButton.addEventListener("click", downloadJSON);
    selectors.copyButton.addEventListener("click", copyJSON);
    selectors.resetButton.addEventListener("click", resetToDefault);
    document.getElementById("add-resource").addEventListener("click", () => {
      createResourceCard();
    });
    document.getElementById("add-process").addEventListener("click", () => {
      createProcessCard();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    resetToDefault();
  });
})();
