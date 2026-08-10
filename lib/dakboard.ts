const DAKBOARD_DISPLAYS = [
  {
    deviceId: "dev_c02d8e5131cd",
    screenId: "615b33af-105a44-9b96-e14c9ba82588",
  },
  {
    deviceId: "dev_349de5a3fc05",
    screenId: "618c2105-105a44-3284-23dbcc3b51b8",
  },
  {
    deviceId: "dev_a896f7fd81f7",
    screenId: "615b33fe-105a44-cad4-116052e55442",
  },
  {
    deviceId: "dev_c7f4a05a4350",
    screenId: "624c8fe8-105a44-f55a-72dbdeaa56ca",
  },
];

export async function refreshDakboardDisplays() {
  const apiKey = process.env.DAK_API_KEY;

  if (!apiKey) {
    throw new Error("DAK_API_KEY is not configured");
  }

  const results = await Promise.all(
    DAKBOARD_DISPLAYS.map(async ({ deviceId, screenId }) => {
      const url =
        `https://dakboard.com/api/2/devices/${encodeURIComponent(deviceId)}` +
        `?api_key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          screen_id: screenId,
        }),
        cache: "no-store",
      });

      const responseText = await response.text();

      return {
        deviceId,
        screenId,
        success: response.ok,
        status: response.status,
        response: responseText,
      };
    })
  );

  const failed = results.filter((result) => !result.success);

  if (failed.length > 0) {
    throw new Error(
      `DAKboard refresh failed for ${failed.length} display(s): ` +
        failed.map((r) => `${r.deviceId} (${r.status})`).join(", ")
    );
  }

  return results;
}