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

  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "TAVILY_API_KEY is not configured in Netlify."
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
    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          api_key: apiKey,
          query: `"${name}"`,
          search_depth: "basic",
          topic: "general",
          max_results: 10,
          include_answer: false,
          include_raw_content: false,
          include_images: false
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();

      console.error("Tavily Search error:", text);

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

    const results = (data.results || [])
      .slice(0, 10)
      .map((item) => ({
        title: item.title || "",
        description: item.content || "",
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
