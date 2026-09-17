export default async (request) => {
  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "").trim();

  if (!name) {
    return new Response(
      JSON.stringify({
        error: "A name is required."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (name.length > 120) {
    return new Response(
      JSON.stringify({
        error: "Name is too long."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "BRAVE_SEARCH_API_KEY is not configured in Netlify."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const searchUrl =
      "https://api.search.brave.com/res/v1/web/search?" +
      new URLSearchParams({
        q: `"${name}"`,
        count: "10",
        search_lang: "en"
      });

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey
      }
    });

    if (!response.ok) {
      const text = await response.text();

      console.error("Brave Search error:", text);

      return new Response(
        JSON.stringify({
          error: "Public web search failed."
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const data = await response.json();

    const results = (data.web?.results || [])
      .slice(0, 10)
      .map((item) => ({
        title: item.title || "",
        description: item.description || "",
        url: item.url || ""
      }))
      .filter((item) => item.url);

    return new Response(
      JSON.stringify({
        results
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("Public info error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to search the public web."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
