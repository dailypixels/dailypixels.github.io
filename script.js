// =======================
// Premium Blog Script.js
// =======================
let stories = [];
let displayedCount = 0;
const STORIES_PER_LOAD = 6;

const storyContainer = document.getElementById("stories-container");
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const categoryButtons = document.querySelectorAll(".chip");

// Fetch Stories
async function loadStories() {
  const res = await fetch("stories.json");
  stories = await res.json();
  renderStories();
  renderTags();
  renderRecentPosts();
}

// Render Stories
function renderStories(filtered = stories) {
  storyContainer.innerHTML = "";
  displayedCount = 0;
  loadMoreStories(filtered);
}

function loadMoreStories(filtered = stories) {
  const slice = filtered.slice(displayedCount, displayedCount + STORIES_PER_LOAD);
  slice.forEach(story => {
    const card = document.createElement("article");
    card.className = "story-card";
    card.innerHTML = `
      <a class="thumb" href="${story.filePath}">
        <img src="${story.featuredImage}" alt="${story.title}">
      </a>
      <div class="story-body">
        <h3><a href="${story.filePath}">${story.title}</a></h3>
        <p class="meta">${story.date} • ${story.author}</p>
        <p class="excerpt">${story.excerpt}</p>
        <a class="text-link" href="${story.filePath}">Read More →</a>
      </div>
    `;
    storyContainer.appendChild(card);
  });
  displayedCount += slice.length;
  loadMoreBtn.style.display = displayedCount >= filtered.length ? "none" : "block";
}

// Tags
function renderTags() {
  const tagsContainer = document.getElementById("tags");
  const tags = [...new Set(stories.flatMap(s => s.tags))];
  tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    span.onclick = () => renderStories(stories.filter(s => s.tags.includes(tag)));
    tagsContainer.appendChild(span);
  });
}

// Recent Posts
function renderRecentPosts() {
  const list = document.getElementById("recentPosts");
  stories.slice(-5).reverse().forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${s.filePath}">${s.title}</a>`;
    list.appendChild(li);
  });
}

// Search
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    const filtered = stories.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.author.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
    renderStories(filtered);
  });
}

// Categories
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    if (btn.dataset.filter === "all") return renderStories();
    renderStories(stories.filter(s => s.category.toLowerCase() === btn.dataset.filter));
  });
});

loadMoreBtn.addEventListener("click", () => loadMoreStories());

document.addEventListener("DOMContentLoaded", loadStories);
/* ========== Smooth scroll helper (for any link with data-scroll) ========== */
function smoothScrollTo(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const isOffscreen = rect.top < 0 || rect.top > window.innerHeight * 0.3;
  if (isOffscreen) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* Hook any <a data-scroll="#id"> links (e.g., Stories in nav, Start Reading) */
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[data-scroll]');
  if (!a) return;
  e.preventDefault();
  const sel = a.getAttribute("data-scroll");
  smoothScrollTo(sel);
});

/* ========== Category filtering (sidebar + tag chips anywhere) ========== */
(function initCategoryFiltering() {
  const listContainer = document.getElementById("stories") || document.querySelector('[data-stories-root]') || document.body;
  const cards = () => Array.from(document.querySelectorAll(".story-card"));
  const categoriesLinks = Array.from(document.querySelectorAll('.category-link[data-filter], .chip[data-filter], a[data-filter]'));

  function applyFilter(filter) {
    const f = (filter || "all").toLowerCase();
    cards().forEach(card => {
      const c = (card.dataset.category || "").toLowerCase();
      const visible = (f === "all") || (c === f);
      card.style.display = visible ? "" : "none";
    });
    // Only scroll if stories section is off-screen
    if (document.getElementById("stories")) smoothScrollTo("#stories");
    // Mark active
    categoriesLinks.forEach(a => a.classList.toggle("is-active", a.dataset.filter.toLowerCase() === f));
  }

  // Click handler
  document.addEventListener("click", (e) => {
    const link = e.target.closest('.category-link[data-filter], .chip[data-filter], a[data-filter]');
    if (!link) return;
    // Ignore if it's not part of category filtering
    if (!link.classList.contains("category-link") && !link.classList.contains("chip") && link.getAttribute("data-filter") == null) return;

    e.preventDefault();
    const filter = link.dataset.filter || "all";
    applyFilter(filter);
    // Update URL hash (optional, won’t reload)
    history.replaceState({}, "", filter === "all" ? location.pathname : `#cat=${encodeURIComponent(filter)}`);
  });

  // Init from hash if present
  const m = location.hash.match(/#cat=([^&]+)/);
  if (m) applyFilter(decodeURIComponent(m[1]));
})();

/* ========== Shared list loaders for NEWS / BLOGS pages (optional, matches story card style) ========== */
async function loadPosts(jsonPath, mountSelector) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return;
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    const html = data.map(post => `
      <article class="story-card" data-category="${post.category || 'news'}" data-title="${post.title}">
        <a class="thumb" href="${post.filePath}">
          <img src="${post.featuredImage}" alt="${post.title}">
        </a>
        <div class="story-body">
          <h3><a href="${post.filePath}">${post.title}</a></h3>
          <p class="meta">${post.date} • ${post.author}</p>
          <p class="excerpt">${post.excerpt}</p>
          <a class="text-link" href="${post.filePath}">Read More →</a>
        </div>
      </article>
    `).join("");
    mount.innerHTML = html;
  } catch (err) {
    console.error("Failed to load posts:", err);
    mount.innerHTML = `<p class="muted">Couldn’t load posts right now.</p>`;
  }
}

/* Auto-init on pages that have a #news-list or #blogs-list container */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("news-list")) loadPosts("news.json", "#news-list");
  if (document.getElementById("blogs-list")) loadPosts("blogs.json", "#blogs-list");
});
/* ===== CATEGORY & TAG FILTER ===== */
document.addEventListener("click", (e) => {
  const tagOrCat = e.target.closest('.tag, .category-link');
  if (!tagOrCat) return;

  e.preventDefault();
  const filter = tagOrCat.dataset.filter || "all";

  // Scroll smoothly to stories section
  const storiesSection = document.getElementById("stories");
  if (storiesSection) {
    storiesSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Show/hide stories
  document.querySelectorAll(".story-card").forEach((card) => {
    const category = card.dataset.category?.toLowerCase() || "";
    const tags = (card.dataset.tags || "").toLowerCase();
    const match = filter === "all" || category === filter || tags.includes(filter);
    card.style.display = match ? "" : "none";
  });

  // Remove all active states
  document.querySelectorAll(".tag, .category-link").forEach(el => el.classList.remove("is-active"));

  // Mark current active
  tagOrCat.classList.add("is-active");
});
// Generic content loader (stories, blogs, news)
async function loadContent(jsonFile, containerId) {
  try {
    const response = await fetch(jsonFile);
    const data = await response.json();
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = data.map(item => `
      <article class="story-card" data-category="${item.category}">
        <a class="thumb" href="${item.filePath}">
          <img src="${item.featuredImage}" alt="${item.title}">
        </a>
        <div class="story-body">
          <h3><a href="${item.filePath}">${item.title}</a></h3>
          <p class="meta">${item.date} • ${item.author}</p>
          <p class="excerpt">${item.excerpt}</p>
          <a class="text-link" href="${item.filePath}">Read More →</a>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error(`Error loading ${jsonFile}:`, err);
  }
}

// Load based on page
if (document.getElementById('blogsList')) {
  loadContent('blogs.json', 'blogsList');
}
if (document.getElementById('newsList')) {
  loadContent('news.json', 'newsList');
}
function enableCategoryFiltering() {
  const categoryLinks = document.querySelectorAll('.category-link');
  const storyCards = document.querySelectorAll('.story-card');

  categoryLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const selectedCategory = link.dataset.filter;

      // Highlight active category
      categoryLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show/hide cards based on category
      storyCards.forEach(card => {
        const category = card.dataset.category;
        if (selectedCategory === 'all' || category === selectedCategory) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      // Smooth scroll to stories section if not visible
      const storiesSection = document.querySelector('.story-card');
      if (storiesSection) {
        storiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', enableCategoryFiltering);
document.getElementById("menu-toggle").addEventListener("click", function () {
  document.querySelector(".nav-links").classList.toggle("show");
});
document.addEventListener("DOMContentLoaded", () => {
  const categoryLinks = document.querySelectorAll(".category-link");
  const tagLinks = document.querySelectorAll(".tag-link");
  const storyCards = document.querySelectorAll(".story-card");
  const storiesSection = document.querySelector(".stories-section");

  function filterStories(filter) {
    storyCards.forEach(card => {
      const category = card.dataset.category?.toLowerCase();
      const tags = card.dataset.tags?.toLowerCase() || "";

      if (filter === "all" || category === filter || tags.includes(filter)) {
        card.classList.remove("hidden");
        setTimeout(() => {
          card.style.display = "block";
        }, 300);
      } else {
        card.classList.add("hidden");
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  }

  function setActiveLink(clickedLink, group) {
    group.forEach(link => link.classList.remove("active"));
    clickedLink.classList.add("active");
  }

  function scrollToStories() {
    if (storiesSection) {
      storiesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function addClickHandlers(links, group) {
    links.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const filter = link.dataset.filter?.toLowerCase() || "all";
        filterStories(filter);
        setActiveLink(link, group);
        scrollToStories();
      });
    });
  }

  addClickHandlers(categoryLinks, categoryLinks);
  addClickHandlers(tagLinks, tagLinks);
});
// Automatically add fade-in class to all main homepage sections
document.addEventListener('DOMContentLoaded', () => {
  // Select all major content blocks inside <main> and any key homepage sections
  const sections = document.querySelectorAll(
    'main > section, .featured-stories, .recent-posts, .category-list, .hero, .page-section'
  );

  sections.forEach(section => {
    section.classList.add('fade-in');
  });

  // Sticky header on scroll
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
    }
  });

  // Fade-in on scroll observer
  const appearOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, appearOptions);

  document.querySelectorAll('.fade-in').forEach(fader => {
    appearOnScroll.observe(fader);
  });

  // Smooth scroll for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(anchor.getAttribute('href'))
        .scrollIntoView({ behavior: 'smooth' });
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('#storySearch');
  const stories = document.querySelectorAll('.post-card');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();

      stories.forEach(card => {
        const title = card.querySelector('.post-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.post-excerpt') 
                        ? card.querySelector('.post-excerpt').textContent.toLowerCase()
                        : '';

        if (title.includes(query) || excerpt.includes(query)) {
          card.parentElement.style.display = ''; // show
        } else {
          card.parentElement.style.display = 'none'; // hide
        }
      });
    });
  }
});
// SEARCH FUNCTIONALITY
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const storyCards = document.querySelectorAll('.story-card');

  if (!searchInput) return; // safety check

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    storyCards.forEach(card => {
      const title = card.dataset.title.toLowerCase();
      if (title.includes(query) || query === '') {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});
// script.js
document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('#searchInput');
  if (!input) return;

  // Utility: normalize text (lowercase, trim, remove extra spaces)
  const norm = s => (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Collect searchable items across homepage/category pages
  // 1) Card-style stories
  const cardNodes = Array.from(document.querySelectorAll('.post-card'));

  // 2) Featured cards (if you use a different class)
  const featuredCards = Array.from(document.querySelectorAll('.featured-story-card'));

  // 3) Recent posts list items (links inside .recent-posts)
  const recentLinks = Array.from(document.querySelectorAll('.recent-posts a, .recent-posts li a'));

  // Build a unified list of items with getText() and show/hide()
  const items = [];

  // Helper to get the clickable wrapper to show/hide cleanly
  const getWrapper = el => el.closest('a, article, li, div') || el;

  // Card-style items
  [...cardNodes, ...featuredCards].forEach(card => {
    const titleEl = card.querySelector('.post-title') || card.querySelector('h3, h2');
    const excerptEl = card.querySelector('.post-excerpt');
    const wrapper = getWrapper(card);

    items.push({
      node: wrapper,
      getText: () => norm(
        (titleEl?.textContent || '') + ' ' + (excerptEl?.textContent || '')
      ),
      show: () => { wrapper.classList.remove('hidden'); },
      hide: () => { wrapper.classList.add('hidden'); }
    });
  });

  // Recent posts list items
  recentLinks.forEach(link => {
    const wrapper = getWrapper(link);
    items.push({
      node: wrapper,
      getText: () => norm(link.textContent),
      show: () => { wrapper.classList.remove('hidden'); },
      hide: () => { wrapper.classList.add('hidden'); }
    });
  });

  // No-results message (inserts once, beside the input)
  let noResults = document.querySelector('#noResultsMessage');
  if (!noResults) {
    noResults = document.createElement('div');
    noResults.id = 'noResultsMessage';
    noResults.textContent = 'No matching stories.';
    noResults.className = 'no-results hidden';
    const wrap = input.closest('.search-wrap') || input.parentElement;
    wrap.appendChild(noResults);
  }

  // Debounce to keep typing smooth
  let t;
  const debounce = (fn, ms = 200) => (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };

  const applyFilter = () => {
    const q = norm(input.value);
    let matches = 0;

    if (!q) {
      // Empty query: show everything
      items.forEach(it => it.show());
      noResults.classList.add('hidden');
      return;
    }

    items.forEach(it => {
      const text = it.getText();
      if (text.includes(q)) {
        it.show();
        matches++;
      } else {
        it.hide();
      }
    });

    if (matches === 0) noResults.classList.remove('hidden');
    else noResults.classList.add('hidden');
  };

  // Initial run and listeners
  applyFilter();
  input.addEventListener('input', debounce(applyFilter, 150));
});
document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'dailyPixelBookmarks';
  // Load saved bookmarks (array of URLs)
  let bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]');

  document.querySelectorAll('.post-card').forEach(card => {
    const link = card.closest('a')?.getAttribute('href');
    if (!link) return;

    // Create SVG bookmark icon
    const svgNS = 'http://www.w3.org/2000/svg';
    const btn = document.createElementNS(svgNS, 'svg');
    btn.setAttribute('viewBox', '0 0 24 24');
    btn.classList.add('bookmark-icon');
    btn.innerHTML = '<path d="M6 4v17l6-5.058L18 21V4z"/>'; 
    card.appendChild(btn);

    // Mark as bookmarked if in localStorage
    if (bookmarks.includes(link)) {
      btn.classList.add('bookmarked');
    }

    // Toggle on click
    btn.addEventListener('click', e => {
      e.preventDefault();
      const idx = bookmarks.indexOf(link);
      if (idx > -1) {
        bookmarks.splice(idx, 1);
        btn.classList.remove('bookmarked');
      } else {
        bookmarks.push(link);
        btn.classList.add('bookmarked');
      }
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  // ===== Scroll Progress Bar =====
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrolled + '%';
});

// ===== Reading Time =====
const article = document.querySelector('.story-page');
if (article) {
  const text = article.textContent || '';
  const words = text.trim().split(/\s+/).length;
  const wordsPerMinute = 200; // average reading speed
  const minutes = Math.ceil(words / wordsPerMinute);

  // Find the meta line (date/author) and append reading time
  const meta = article.querySelector('.meta');
  if (meta) {
    const badge = document.createElement('span');
    badge.className = 'reading-time';
    badge.textContent = `${minutes} min read`;
    meta.appendChild(badge);
  }
}

  // … your existing bookmark, search, fade-in, etc. code …

  // ===== Load More for .post-grid =====
  const CARDS_TO_SHOW = 6;

  document.querySelectorAll('.post-grid').forEach(grid => {
    const cards = Array.from(grid.children);
    if (cards.length <= CARDS_TO_SHOW) return;  // no need to paginate

    // Hide cards beyond the first CARDS_TO_SHOW
    cards.forEach((card, i) => {
      if (i >= CARDS_TO_SHOW) card.classList.add('hidden');
    });

    // Create Load More container & button
    const container = document.createElement('div');
    container.className = 'load-more-container';
    const btn = document.createElement('button');
    btn.className = 'load-more-btn';
    btn.textContent = 'Load More';
    container.appendChild(btn);
    grid.after(container);

    // On click: reveal next batch
    btn.addEventListener('click', () => {
      // Find hidden cards and unhide up to CARDS_TO_SHOW
      const hiddenCards = grid.querySelectorAll('.hidden');
      for (let i = 0; i < CARDS_TO_SHOW && i < hiddenCards.length; i++) {
        hiddenCards[i].classList.remove('hidden');
      }
      // If none left hidden, remove button
      if (grid.querySelectorAll('.hidden').length === 0) {
        container.remove();
      }
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }

  // Create toggle button
  const btn = document.createElement('button');
  btn.className = 'dark-mode-toggle';
  btn.title = 'Toggle dark mode';
  btn.innerHTML = '🌙';
  document.body.appendChild(btn);

  // Toggle on click
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    btn.innerHTML = isDark ? '☀️' : '🌙';
  });

  // Set correct icon on load
  if (document.body.classList.contains('dark')) {
    btn.innerHTML = '☀️';
  }
});
document.addEventListener('DOMContentLoaded', () => {
  // ===== Related Stories =====
  const relatedData = [
    {
      title: 'Whispers Beneath the Pines',
      url: '../Nature/nature1.html',
      img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop',
      meta: 'Mar 18, 2025 • Sophia Green',
      tags: ['nature', 'forest']
    },
    {
      title: 'The Echo of Mountains',
      url: '../Nature/nature2.html',
      img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop',
      meta: 'Mar 21, 2025 • Liam Stone',
      tags: ['nature', 'mountains']
    },
    {
      title: 'Harbor Lights at Dusk',
      url: '../Travel/travel3.html',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      meta: 'Apr 18, 2025 • Marco Alvarez',
      tags: ['travel', 'sea']
    },
    {
      title: 'Through the Lens — A Conversation with Daniel Okoro',
      url: '../Interviews/interview2.html',
      img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop',
      meta: 'Jun 18, 2025 • Sara Malik',
      tags: ['photography', 'interview']
    }
    // Add more posts here with tags
  ];

  const article = document.querySelector('.story-page');
  if (article) {
    // Get tags from a data attribute on the article (set in HTML) or fallback
    const currentTags = (article.dataset.tags || '').split(',').map(t => t.trim().toLowerCase());

    // Find matches
    const matches = relatedData.filter(post =>
      post.tags.some(tag => currentTags.includes(tag))
    ).slice(0, 3);

    if (matches.length > 0) {
      const section = document.createElement('section');
      section.className = 'related-stories';
      section.innerHTML = `<h2>You Might Also Like</h2>
        <div class="related-grid">
          ${matches.map(m => `
            <a href="${m.url}" class="related-card">
              <img src="${m.img}" alt="${m.title}">
              <div class="related-card-content">
                <div class="related-card-title">${m.title}</div>
                <div class="related-card-meta">${m.meta}</div>
              </div>
            </a>
          `).join('')}
        </div>`;
      article.appendChild(section);
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.querySelector('#newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault(); // stop the page reload

      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      // Simulate success
      emailInput.value = '';
      let success = newsletterForm.querySelector('.success-message');
      if (!success) {
        success = document.createElement('div');
        success.className = 'success-message';
        newsletterForm.appendChild(success);
      }
      success.textContent = 'Thanks for subscribing!';
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.querySelector('#newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
// ===== Tag Cloud Filtering + Search Integration =====
const searchInput = document.querySelector('#searchInput');
const tags = document.querySelectorAll('.tag');
const storyCards = document.querySelectorAll('.post-card');

let activeTags = [];

function applyFilters() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  storyCards.forEach(card => {
    const title = card.querySelector('.post-title')?.textContent.toLowerCase() || '';
    const excerpt = card.querySelector('.post-excerpt')?.textContent.toLowerCase() || '';
    const cardTags = (card.dataset.tags || '').toLowerCase().split(',').map(t => t.trim());

    const matchesSearch = !query || title.includes(query) || excerpt.includes(query);
    const matchesTags = activeTags.length === 0 || activeTags.every(tag => cardTags.includes(tag));

    if (matchesSearch && matchesTags) {
      card.closest('a, article, div').style.display = '';
    } else {
      card.closest('a, article, div').style.display = 'none';
    }
  });
}

// Tag click handling
tags.forEach(tagBtn => {
  tagBtn.addEventListener('click', () => {
    const tag = tagBtn.dataset.tag.toLowerCase();
    tagBtn.classList.toggle('active');

    if (tagBtn.classList.contains('active')) {
      activeTags.push(tag);
    } else {
      activeTags = activeTags.filter(t => t !== tag);
    }
    applyFilters();
  });
});

// Search input handling
if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

      // Simulate success
      emailInput.value = '';

      let success = newsletterForm.querySelector('.success-message');
      if (!success) {
        success = document.createElement('div');
        success.className = 'success-message';
        newsletterForm.appendChild(success);
      }
      success.textContent = 'Thanks for subscribing!';
      success.style.opacity = '0';
      success.style.transition = 'opacity 0.5s ease';
      requestAnimationFrame(() => {
        success.style.opacity = '1';
      });

      // Auto-hide after 3 seconds
      setTimeout(() => {
        success.style.opacity = '0';
      }, 3000);
    });
  }
});
function applyFilters() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  storyCards.forEach(card => {
    const title = (card.dataset.title || '').toLowerCase();
    const excerpt = card.querySelector('.post-excerpt, .excerpt')?.textContent.toLowerCase() || '';
    const cardTags = (card.dataset.tags || '').toLowerCase().split(',').map(t => t.trim());

    const matchesSearch = !query || title.includes(query) || excerpt.includes(query);
    const matchesTags = activeTags.length === 0 || activeTags.every(tag => cardTags.includes(tag));

    card.style.display = (matchesSearch && matchesTags) ? '' : 'none';
  });
}
document.addEventListener('DOMContentLoaded', () => {
  // Detect if we're on a story, news, or category page
  const contentPage = document.querySelector('.story-page, .news-page, .category-page');
  if (!contentPage) return;

  // Create comments section
  const commentsSection = document.createElement('section');
  commentsSection.className = 'comments';
  commentsSection.innerHTML = `
    <h2>Comments</h2>
    <div id="disqus_thread"></div>
  `;
  contentPage.appendChild(commentsSection);

  // Disqus config
  window.disqus_config = function () {
    this.page.url = window.location.href;        // Canonical URL
    this.page.identifier = window.location.pathname; // Unique identifier
  };

  // Load Disqus
  const d = document, s = d.createElement('script');
  s.src = 'https://daily-pixel.disqus.com/embed.js'; // Your shortname
  s.setAttribute('data-timestamp', +new Date());
  (d.head || d.body).appendChild(s);
});
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.post-grid, .story-list');
  if (!container) return;

  fetch('stories.json')
    .then(res => res.json())
    .then(stories => {
      stories.forEach(story => {
        const card = document.createElement('article');
        card.className = 'post-card';
        card.dataset.tags = story.tags.join(',');
        card.dataset.title = story.title;

        card.innerHTML = `
          <a href="${story.url}">
            <img src="${story.image}" alt="${story.title}">
            <h3 class="post-title">${story.title}</h3>
          </a>
          <p class="post-meta">${story.author} • ${story.date}</p>
          <p class="post-excerpt">${story.excerpt}</p>
        `;

        container.appendChild(card);
      });

      // Re-run your existing search/tag/bookmark functions here if needed
      if (typeof initSearch === 'function') initSearch();
      if (typeof initTags === 'function') initTags();
      if (typeof initBookmarks === 'function') initBookmarks();
    })
    .catch(err => console.error('Error loading stories:', err));
});
document.addEventListener("DOMContentLoaded", () => {
  const stories = document.querySelectorAll(".story-card");
  const loadMoreBtn = document.getElementById("loadMore");
  const searchInput = document.getElementById("searchInput");

  let visibleCount = 12; // Show 12 at first

  function updateStories() {
    stories.forEach((story, index) => {
      story.style.display = index < visibleCount ? "" : "none";
    });

    if (visibleCount >= stories.length) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "block";
    }
  }

  // Load more stories
  loadMoreBtn.addEventListener("click", () => {
    visibleCount += 6; // Load 6 more
    updateStories();
  });

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    stories.forEach(story => {
      const title = story.dataset.title?.toLowerCase() || "";
      if (title.includes(query)) {
        story.style.display = "";
      } else {
        story.style.display = "none";
      }
    });

    // Hide load more button if searching
    loadMoreBtn.style.display = query ? "none" : "block";
  });

  // Init
  updateStories();
});
document.addEventListener("DOMContentLoaded", () => {
  const storiesContainer = document.getElementById("storiesGrid");
  const stories = storiesContainer.querySelectorAll(".story-card");
  const loadMoreBtn = document.getElementById("loadMore");
  const searchInput = document.getElementById("searchInput");

  let visibleCount = 5; // Show 5 initially
  const increment = 5;  // Load 5 more each click

  function updateStories() {
    stories.forEach((story, index) => {
      story.style.display = index < visibleCount ? "" : "none";
    });

    if (visibleCount >= stories.length) {
      loadMoreBtn.textContent = "No More Stories";
      loadMoreBtn.disabled = true;
    } else {
      loadMoreBtn.textContent = "Load More";
      loadMoreBtn.disabled = false;
    }
  }

  loadMoreBtn.addEventListener("click", () => {
    visibleCount += increment;
    updateStories();
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    stories.forEach(story => {
      const title = story.dataset.title?.toLowerCase() || "";
      story.style.display = title.includes(query) ? "" : "none";
    });
    loadMoreBtn.style.display = query ? "none" : "block";
  });

  updateStories();
});
let allStories = [];
let visibleCount = 5;
const increment = 5;

async function loadStories() {
  try {
    const res = await fetch('stories.json');
    allStories = await res.json();
    renderStories();
  } catch (err) {
    console.error("Error loading stories:", err);
  }
}

function renderStories() {
  const grid = document.getElementById('storiesGrid');
  grid.innerHTML = '';

  const visibleStories = allStories.slice(0, visibleCount);
  visibleStories.forEach(story => {
    const article = document.createElement('article');
    article.className = 'story-card';
    article.dataset.title = story.title.toLowerCase();

    article.innerHTML = `
      <a class="thumb" href="${story.filePath}">
        <img src="${story.featuredImage}" alt="${story.title}">
      </a>
      <div class="story-body">
        <h3><a href="${story.filePath}">${story.title}</a></h3>
        <p class="meta">${story.date} • ${story.author}</p>
        <p class="excerpt">${story.excerpt}</p>
        <a class="text-link" href="${story.filePath}">Read More →</a>
      </div>
    `;
    grid.appendChild(article);
  });

  const btn = document.getElementById('loadMore');
  if (visibleCount >= allStories.length) {
    btn.textContent = 'No More Stories';
    btn.disabled = true;
  } else {
    btn.textContent = 'Load More Stories';
    btn.disabled = false;
  }
}

document.getElementById('loadMore').addEventListener('click', () => {
  visibleCount += increment;
  renderStories();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.story-card');
  cards.forEach(card => {
    const title = card.dataset.title;
    card.style.display = title.includes(q) ? '' : 'none';
  });
});

document.addEventListener('DOMContentLoaded', loadStories);
document.addEventListener("DOMContentLoaded", () => {
  const storiesGrid = document.getElementById("storiesGrid");
  const loadMoreButton = document.getElementById("loadMore");
  let allStories = [];
  let currentIndex = 0;
  const STORIES_PER_PAGE = 10;

  // Restore state
  const savedIndex = parseInt(localStorage.getItem("currentIndex") || STORIES_PER_PAGE);
  const savedScroll = parseInt(localStorage.getItem("scrollPosition") || 0);

  // Fetch stories.json
  fetch("stories.json")
    .then((res) => res.json())
    .then((data) => {
      allStories = data;
      currentIndex = savedIndex;
      renderStories(currentIndex);

      // Scroll AFTER rendering
      setTimeout(() => {
        if (savedScroll > 0) {
          window.scrollTo({ top: savedScroll, behavior: "instant" });
        }
      }, 200);
    });

  function renderStories(count) {
    storiesGrid.innerHTML = "";
    const storiesToRender = allStories.slice(0, count);
    storiesToRender.forEach((story) => {
      const card = createStoryCard(story);
      storiesGrid.appendChild(card);
    });
    currentIndex = storiesToRender.length;
    toggleLoadMore();

    // Attach save event to all story links
    document.querySelectorAll(".story-card a").forEach(link => {
      link.addEventListener("click", () => {
        saveState();
      });
    });
  }

  function toggleLoadMore() {
    loadMoreButton.style.display = currentIndex >= allStories.length ? "none" : "block";
  }

  loadMoreButton.addEventListener("click", () => {
    currentIndex += STORIES_PER_PAGE;
    renderStories(currentIndex);
    saveState();
  });

  function createStoryCard(story) {
    const article = document.createElement("article");
    article.className = "story-card";
    article.dataset.category = story.category.toLowerCase();
    article.dataset.tags = story.tags.join(",");
    article.dataset.title = story.title;

    article.innerHTML = `
      <a class="thumb" href="${story.filePath}">
        <img src="${story.featuredImage}" alt="${story.title}">
      </a>
      <div class="story-body">
        <h3><a href="${story.filePath}">${story.title}</a></h3>
        <p class="meta">${story.date} • ${story.author}</p>
        <p class="excerpt">${story.excerpt}</p>
        <a class="text-link" href="${story.filePath}">Read More →</a>
      </div>
    `;
    return article;
  }

  function saveState() {
    localStorage.setItem("currentIndex", currentIndex);
    localStorage.setItem("scrollPosition", window.scrollY);
  }
});
document.addEventListener("DOMContentLoaded", function() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const favoritesSlider = document.getElementById("favoritesSlider");

  if (favorites.length === 0) {
    favoritesSlider.innerHTML = "<p>No favorite stories yet ❤️</p>";
  } else {
    favorites.forEach(storyHTML => {
      favoritesSlider.innerHTML += storyHTML;
    });
  }
});
// Add this to script.js
const tags = document.querySelectorAll("#tagCloud .chip");
tags.forEach(tag => {
  tag.addEventListener("click", () => {
    const tagName = tag.dataset.tag;
    document.querySelectorAll(".story-card").forEach(card => {
      card.style.display = card.dataset.tags.includes(tagName) ? "" : "none";
    });
  });
});
  const darkToggle = document.getElementById("darkToggle");
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    darkToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  });
    const backToTop = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 300 ? "block" : "none";
  });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  const links = document.querySelectorAll(".category-link");
const cards = document.querySelectorAll(".story-card");

links.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const category = link.dataset.category;

    cards.forEach(card => {
      if (category === "all" || card.dataset.category === category) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
});
function filterStories(category) {
  currentCategory = category;
  let shown = 0;

  storyCards.forEach(card => {
    const cardCategory = card.getAttribute("data-category").toLowerCase();
    if (category === "all" || cardCategory === category) {
      card.style.display = "block"; // show everything
      shown++;
    } else {
      card.style.display = "none";
    }
  });

  // Always hide the button since all are shown
  showMoreBtn.style.display = "none";
}
// storyFeatures.js
document.addEventListener("DOMContentLoaded", () => {
  const storyTitle = document.querySelector("h1")?.innerText;
  if (!storyTitle) return;

  // ===== Likes Feature =====
  const likeContainer = document.createElement("div");
  likeContainer.classList.add("story-likes");
  const likesKey = `likes_${storyTitle}`;

  let likes = parseInt(localStorage.getItem(likesKey)) || 0;

  likeContainer.innerHTML = `
    <button id="likeBtn">👍 Like</button> <span id="likeCount">${likes}</span> Likes
  `;

  const container = document.querySelector("body");
  container.appendChild(likeContainer);

  const likeBtn = document.getElementById("likeBtn");
  const likeCount = document.getElementById("likeCount");

  likeBtn.addEventListener("click", () => {
    likes++;
    likeCount.innerText = likes;
    localStorage.setItem(likesKey, likes);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const stories = document.querySelectorAll("#storiesWrapper .story-card");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  let currentLimit = 10; // initial visible
  let step = 10;         // start step

  function updateStories() {
    stories.forEach((story, index) => {
      story.style.display = index < currentLimit ? "block" : "none";
    });

    // Hide button if all are shown
    if (currentLimit >= stories.length) {
      loadMoreBtn.style.display = "none";
    }
  }

  loadMoreBtn.addEventListener("click", () => {
    currentLimit += step;
    if (step === 10) {
      step = 20; // next load 20
    } else if (step === 20) {
      step = 30; // next load 30
    }
    updateStories();
  });

  // Initial setup
  updateStories();
});
document.addEventListener("DOMContentLoaded", function () {
  const banner = document.getElementById("cookie-banner");
  const button = document.getElementById("accept-cookies");

  if (!localStorage.getItem("cookiesAccepted")) {
    banner.style.display = "flex";
  }

  button.addEventListener("click", function () {
    localStorage.setItem("cookiesAccepted", "true");
    banner.style.display = "none";
  });
});
