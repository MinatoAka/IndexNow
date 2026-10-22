// ==========================================
// TRIGGER UTILITIES
// ==========================================

function getManagedTriggerNames() {
  return ["submitToIndexNowWithLog", "autoDeleteIndexNowLog"];
}

function getTriggersByFunctionName(functionName) {
  return ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === functionName;
  });
}

function deleteTriggersByFunctionName(functionName) {
  getTriggersByFunctionName(functionName).forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
}

function ensureClockTrigger(functionName, buildTrigger, isValidTrigger) {
  const triggers = getTriggersByFunctionName(functionName);

  if (triggers.some(isValidTrigger)) {
    return;
  }

  deleteTriggersByFunctionName(functionName);
  buildTrigger();
}

function setupTriggerFinal() {
  const triggerConfigs = [
    {
      functionName: "submitToIndexNowWithLog",
      buildTrigger: function () {
        ScriptApp.newTrigger("submitToIndexNowWithLog")
          .timeBased()
          .everyHours(6)
          .create();
      },
      isValidTrigger: function (trigger) {
        return (
          trigger.getHandlerFunction() === "submitToIndexNowWithLog" &&
          trigger.getEventType() === ScriptApp.EventType.CLOCK
        );
      }
    },
    {
      functionName: "autoDeleteIndexNowLog",
      buildTrigger: function () {
        ScriptApp.newTrigger("autoDeleteIndexNowLog")
          .timeBased()
          .everyWeeks(1)
          .onWeekDay(ScriptApp.WeekDay.MONDAY)
          .atHour(8)
          .create();
      },
      isValidTrigger: function (trigger) {
        return (
          trigger.getHandlerFunction() === "autoDeleteIndexNowLog" &&
          trigger.getEventType() === ScriptApp.EventType.CLOCK
        );
      }
    }
  ];

  triggerConfigs.forEach(function (config) {
    ensureClockTrigger(config.functionName, config.buildTrigger, config.isValidTrigger);
  });
}
