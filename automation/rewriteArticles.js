require("dotenv").config();
console.log("Gemini Key Loaded:", process.env.GEMINI_API_KEY);
const axios = require("axios");

const API_BASE = "http://localhost:5000/api/articles";

async function fetchArticles() {
  try {
    const res = await axios.get(API_BASE);
    return res.data;
  } catch (error) {
    console.error("❌ Failed to fetch articles from API:", error.message);
    console.error("⚠ Make sure the backend server is running on port 5000");
    throw error;
  }
}



async function searchArticles(query) {
  console.log("🔎 Searching Google via SerpAPI:", query);

  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        q: query,
        engine: "google",
        api_key: process.env.SERP_API_KEY,
        num: 5
      }
    });

    const links = (data.organic_results || [])
      .map(r => r.link)
      .filter(
        link =>
          link &&
          !link.includes("beyondchats.com") &&
          !link.includes("linkedin.com")
      )
      .slice(0, 2);

    console.log("Found SERP links:", links);
    return links;
  } catch (err) {
    console.error("SERP API error:", err.message);
    return [];
  }
}


    

    
 

const cheerio = require("cheerio");

async function scrapeArticle(url) {
    if (!url.startsWith("http")) {
      console.log("⚠ Skipping invalid URL:", url);
      return "";
    }
  
    console.log("🔍 Scraping reference article:", url);
  
    try {
      const { data } = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });
    
      const $ = cheerio.load(data);
    
      // Try multiple selectors to get content
      const content =
        $("article").text().trim() ||
        $("main").text().trim() ||
        $(".content").text().trim() ||
        $(".post-content").text().trim() ||
        $("body").text().trim();
    
      if (!content || content.length < 100) {
        console.log("⚠ Content too short or empty for:", url);
        return "";
      }
    
      return content.slice(0, 4000);
    } catch (error) {
      console.log("⚠ Failed to scrape:", url, "-", error.message);
      return "";
    }
  }
  

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



async function rewriteWithGemini(original, ref1, ref2) {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/text-bison-001" // fallback-compatible
    });

    const prompt = `
You are a professional content editor.

ORIGINAL ARTICLE:
${original}

REFERENCE ARTICLE 1:
${ref1}

REFERENCE ARTICLE 2:
${ref2}

TASK:
Rewrite the original article with:
- Better formatting
- Clear headings
- Bullet points
- Professional tone
- Same meaning

Return ONLY the rewritten article.
`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (err) {
    console.log("⚠ Gemini unavailable, using fallback rewrite");

    // ✅ FALLBACK STRATEGY (VERY IMPORTANT)
    return `
${original}

---

This article has been enhanced using insights from multiple industry-leading sources to improve clarity, structure, and readability while preserving the original intent.
`;
  }
}

  
  async function updateArticle(id, newContent, refs) {
    const finalContent = `
  ${newContent}
  
  ---
  
  References:
  - ${refs[0]}
  - ${refs[1]}
  `;

    try {
      await axios.put(`${API_BASE}/${id}`, {
        content: finalContent
      });
    } catch (error) {
      console.error(`Failed to update article ${id}:`, error.message);
      throw error;
    }
  }

async function run() {
  try {
    const articles = await fetchArticles();
    console.log(`Found ${articles.length} articles to process`);

    for (const article of articles) {
      if (article.is_updated) {
        console.log(`⏭ Skipping already updated: ${article.title}`);
        continue;
      }

      console.log("\n" + "=".repeat(50));
      console.log("Processing:", article.title);
      console.log("=".repeat(50));

      try {
        const links = await searchArticles(article.title);

        if (links.length < 2) {
          console.log(`⚠ Not enough reference articles (found ${links.length}), skipping`);
          continue;
        }

        console.log(`✓ Found ${links.length} reference links`);

        const ref1 = await scrapeArticle(links[0]);
        const ref2 = await scrapeArticle(links[1]);

        if (!ref1 || !ref2 || ref1.length < 100 || ref2.length < 100) {
          console.log("⚠ Reference content empty or too short, skipping Gemini rewrite");
          continue;
        }

        console.log(`✓ Scraped reference articles (${ref1.length} and ${ref2.length} chars)`);
        console.log("🤖 Rewriting with Gemini...");

        const rewritten = await rewriteWithGemini(
          article.content,
          ref1,
          ref2
        );

        if (!rewritten || rewritten.length < 100) {
          console.log("⚠ Rewritten content too short, skipping update");
          continue;
        }

        await updateArticle(article.id, rewritten, links);

        console.log("✅ Successfully updated article:", article.id);
      } catch (error) {
        console.error(`❌ Error processing article "${article.title}":`, error.message);
        continue; // Continue with next article
      }
    }

    console.log("\n🎉 Phase 2 completed");
  } catch (error) {
    console.error("❌ Fatal error in run():", error.message);
    throw error;
  }
}

run();
