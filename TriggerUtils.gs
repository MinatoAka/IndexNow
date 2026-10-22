// ==========================================
// TRIGGER UTILITIES
// ==========================================

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

  // Jika sudah ada trigger yang valid, biarkan saja (jangan buat baru)
  if (triggers.some(isValidTrigger)) {
    return;
  }

  // Jika tidak ada yang valid, hapus semua trigger lama dan buat baru
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
        // Cukup cek tipe event karena nama fungsi sudah difilter sebelumnya
        return trigger.getEventType() === ScriptApp.EventType.CLOCK;
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
        return trigger.getEventType() === ScriptApp.EventType.CLOCK;
      }
    }
  ];

  triggerConfigs.forEach(function (config) {
    ensureClockTrigger(config.functionName, config.buildTrigger, config.isValidTrigger);
  });
}
