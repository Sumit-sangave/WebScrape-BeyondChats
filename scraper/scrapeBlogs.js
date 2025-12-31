const axios = require("axios");
const cheerio = require("cheerio");
const pool = require("../db");

async function scrape() {
  try {
    console.log("Loading blogs page...");

    const { data } = await axios.get("https://beyondchats.com/blogs/");
    const $ = cheerio.load(data);

    const blogLinks = [];

    // Collect all blog post links - try multiple patterns
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      
      // Check for blog URLs (both /blog/ and /blogs/)
      const isBlogLink = 
        (href.includes("/blogs/") || href.includes("/blog/")) &&
        !href.includes("/blogs/page") &&
        !href.includes("/blog/page") &&
        !href.endsWith("/blogs") &&
        !href.endsWith("/blog");
      
      if (isBlogLink) {
        const fullUrl = href.startsWith("http")
          ? href
          : `https://beyondchats.com${href.startsWith("/") ? href : "/" + href}`;

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

      try {
        const page = await axios.get(link, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 15000
        });
        const $$ = cheerio.load(page.data);

        // Try multiple selectors for title
        const title =
          $$("h1").first().text().trim() ||
          $$(".entry-title").text().trim() ||
          $$(".post-title").text().trim() ||
          $$("title").text().trim().split("|")[0].trim() ||
          $$("title").text().trim();

        // Try multiple selectors for content - prioritize article content
        let content = "";
        
        // Remove unwanted elements first
        $$("script, style, nav, header, footer, .sidebar, .comments, .social-share, .author-bio").remove();
        
        // Try multiple content selectors
        const contentSelectors = [
          "article .entry-content",
          "article .post-content",
          "article .content",
          ".entry-content",
          ".post-content",
          "article",
          "main .content",
          "main article",
          ".blog-content",
          "main"
        ];

        for (const selector of contentSelectors) {
          const found = $$(selector).first();
          if (found.length > 0) {
            // Get text but preserve some structure
            const text = found.text().trim();
            if (text.length > 200) { // Ensure we got substantial content
              content = text;
              break;
            }
          }
        }

        // Fallback: get body content but clean it up
        if (!content || content.length < 200) {
          $$("script, style, nav, header, footer, .sidebar, .comments, .social-share, .author-bio, .menu, .navigation").remove();
          content = $$("body").text().trim();
          
          // Clean up excessive whitespace
          content = content.replace(/\s+/g, " ").trim();
        }

        if (!content || content.length < 200) {
          console.log("⚠ No substantial content found, skipping");
          continue;
        }

        // Check if article already exists
        const existing = await pool.query(
          "SELECT id FROM articles WHERE original_url = $1",
          [link]
        );

        if (existing.rows.length > 0) {
          console.log("⏭ Article already exists, skipping:", title);
          continue;
        }

        await pool.query(
          "INSERT INTO articles (title, content, original_url) VALUES ($1,$2,$3)",
          [title, content, link]
        );

        console.log("✅ Inserted:", title);
      } catch (err) {
        console.error(`❌ Error scraping ${link}:`, err.message);
        continue;
      }
    }

    console.log("Scraping completed successfully");
  } catch (err) {
    console.error("Scraper error:", err.message);
  }
}

scrape();
