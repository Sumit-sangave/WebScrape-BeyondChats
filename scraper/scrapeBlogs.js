const axios = require("axios");
const cheerio = require("cheerio");
const pool = require("../db");

async function scrape() {
  try {
    console.log("Loading blogs page...");

    const { data } = await axios.get("https://beyondchats.com/blog/");
    const $ = cheerio.load(data);

    const blogLinks = [];

    // Collect all blog post links
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.includes("/blogs/") &&
        !href.includes("/blogs/page")
      ) {
        const fullUrl = href.startsWith("http")
          ? href
          : `https://beyondchats.com${href}`;

        blogLinks.push(fullUrl);
      }
    });

    // Remove duplicates
    const uniqueLinks = [...new Set(blogLinks)];

    console.log("Total blog links found:", uniqueLinks.length);

    // Pick last 5 (oldest)
    const oldestFive = uniqueLinks.slice(-5);

    console.log("Scraping oldest 5 articles...");

    for (const link of oldestFive) {
      console.log("➡ Scraping:", link);

      const page = await axios.get(link);
      const $$ = cheerio.load(page.data);

      const title =
        $$("h1").first().text().trim() ||
        $$("title").text().trim();

      const content = $$("article").text().trim();

      if (!content) {
        console.log("⚠ No content found, skipping");
        continue;
      }

      await pool.query(
        "INSERT INTO articles (title, content, original_url) VALUES ($1,$2,$3)",
        [title, content, link]
      );

      console.log("Inserted:", title);
    }

    console.log("Scraping completed successfully");
  } catch (err) {
    console.error("Scraper error:", err.message);
  }
}

scrape();
