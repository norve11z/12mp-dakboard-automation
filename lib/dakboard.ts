const DAKBOARD_DISPLAYS = [
  {
    deviceId: "dev_c02d8e5131cd",
    screenId: "scr_e14c9ba82588",
  },
  {
    deviceId: "dev_349de5a3fc05",
    screenId: "scr_23dbcc3b51b8",
  },
  {
    deviceId: "dev_a896f7fd81f7",
    screenId: "scr_116052e55442",
  },
  {
    deviceId: "dev_c7f4a05a4350",
    screenId: "scr_72dbdeaa56ca",
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
          Accept: "application/json",
        },
        body: new URLSearchParams({
          screen_id: screenId,
        }).toString(),
        cache: "no-store",
      });

      const responseText = await response.text();

      console.log("DAKBOARD RESPONSE", {
        deviceId,
        screenId,
        status: response.status,
        contentType: response.headers.get("content-type"),
        response: responseText,
      });

      return {
        deviceId,
        screenId,
        success: response.ok,
        status: response.status,
        contentType: response.headers.get("content-type"),
        response: responseText,
      };
    })
  );

  console.log("DAKBOARD RESULTS", results);

  return results;
}