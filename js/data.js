// Sample biography data for Womencypedia
// In a real headless setup, this would come from a CMS API

const biographies = [
    {
        id: 1,
        name: "Mary Mitchell Slessor",
        region: "Africa",
        era: "Colonial",
        domain: "Missionary",
        tags: ["Missionary", "Cultural Bridge", "Presbyterian Church of Nigeria"],
        category: "Spirituality & Faith",
        introduction: "Mary Mitchell Slessor was a Scottish missionary who became a cultural bridge between Western Christianity and indigenous Nigerian traditions.",
        earlyLife: "Born in 1848 in Aberdeen, Scotland, Slessor grew up in poverty and worked in textile mills from age 11.",
        pathToInfluence: "Joined the Presbyterian Church mission in 1875 and was sent to Calabar, Nigeria, where she learned local languages and customs.",
        contributions: "Advocated for women's rights, opposed harmful cultural practices, and served as a magistrate in Nigerian courts.",
        symbolicPower: "Represented a form of Christianity that respected rather than destroyed indigenous culture.",
        culturalContext: "Operated during the height of British colonialism in West Africa, navigating complex power dynamics.",
        legacy: "Her approach influenced modern missionary work and interfaith dialogue.",
        sources: [
            { type: "Primary", title: "Slessor's personal letters", citation: "National Library of Scotland" },
            { type: "Secondary", title: "Mary Slessor: Servant of Calabar", author: "Jeanette Hardage", year: 1990 }
        ],
        relatedWomen: [2], // IDs of related biographies
        relatedMovements: ["Women's Rights in Colonial Africa"],
        relatedDynasties: []
    },
    {
        id: 2,
        name: "Rev. Mgbeke George Okore",
        region: "Africa",
        era: "Post-colonial",
        domain: "Religious Leader",
        tags: ["Ordained Minister", "Presbyterian Church of Nigeria", "Women's Leadership"],
        category: "Spirituality & Faith",
        introduction: "Rev. Mgbeke George Okore was the first ordained female minister in the Presbyterian Church of Nigeria.",
        earlyLife: "Born in Nigeria, she pursued theological education despite societal barriers for women in ministry.",
        pathToInfluence: "Completed theological training and was ordained, breaking gender barriers in the church.",
        contributions: "Served congregations, mentored young women, and advocated for gender equality in religious institutions.",
        symbolicPower: "Symbolized the possibility of women's full participation in traditionally male-dominated religious leadership.",
        culturalContext: "Her ordination occurred during Nigeria's post-independence period, reflecting broader social changes.",
        legacy: "Paved the way for other women in Nigerian religious leadership.",
        sources: [
            { type: "Primary", title: "Church ordination records", citation: "Presbyterian Church of Nigeria Archives" },
            { type: "Community", title: "Oral histories from congregation members", citation: "Collected 2023" }
        ],
        relatedWomen: [1],
        relatedMovements: ["Gender Equality in African Churches"],
        relatedDynasties: []
    },
    {
        id: 3,
        name: "Queen Amina of Zazzau",
        region: "Africa",
        era: "Pre-colonial",
        domain: "Monarch",
        tags: ["Warrior Queen", "Hausa Kingdom", "Military Leader"],
        category: "Leadership",
        introduction: "Queen Amina was a warrior queen of the Zazzau Kingdom in what is now northern Nigeria.",
        earlyLife: "Born into the royal family of Zazzau, she was trained in warfare and statecraft.",
        pathToInfluence: "Ascended to the throne and expanded the kingdom through military campaigns.",
        contributions: "Conquered territories, built defensive walls, and established trade routes.",
        symbolicPower: "Embodied female sovereignty and military prowess in West African history.",
        culturalContext: "Ruled during the 16th century in the Hausa-Fulani region, a period of intense state formation.",
        legacy: "Her legacy continues in Nigerian folklore and modern feminist discourse.",
        sources: [
            { type: "Secondary", title: "The Story of Africa", author: "Patricia McKissack", year: 2000 },
            { type: "Community", title: "Hausa oral traditions", citation: "Documented by historians" }
        ],
        relatedWomen: [],
        relatedMovements: ["African Queenship Systems"],
        relatedDynasties: ["Hausa Kingdoms"]
    },
    {
        id: 4,
        name: "Hypatia of Alexandria",
        region: "Africa",
        era: "Ancient",
        domain: "Philosopher",
        tags: ["Mathematician", "Astronomer", "Classical Philosophy"],
        category: "Science & Innovation",
        introduction: "Hypatia was a renowned mathematician, astronomer, and philosopher in Roman Egypt.",
        earlyLife: "Born in Alexandria around 360 CE, daughter of the mathematician Theon.",
        pathToInfluence: "Became head of the Neoplatonic school in Alexandria, teaching mathematics and philosophy.",
        contributions: "Wrote commentaries on mathematical works, invented scientific instruments, and influenced later scholars.",
        symbolicPower: "Represented the pinnacle of female intellectual achievement in the ancient world.",
        culturalContext: "Lived during the late Roman Empire in Alexandria, a center of learning and cultural exchange.",
        legacy: "Her tragic death became a symbol of the conflict between pagan learning and Christian orthodoxy.",
        sources: [
            { type: "Secondary", title: "Hypatia of Alexandria", author: "Maria Dzielska", year: 1995 },
            { type: "Primary", title: "References in contemporary writings", citation: "Synesius of Cyrene" }
        ],
        relatedWomen: [],
        relatedMovements: ["Ancient Greek Philosophy"],
        relatedDynasties: []
    },
    {
        id: 5,
        name: "Wangari Maathai",
        region: "Africa",
        era: "Contemporary",
        domain: "Environmental Activist",
        tags: ["Nobel Peace Prize", "Green Belt Movement", "Environmentalism"],
        category: "Activism & Justice",
        introduction: "Wangari Maathai was a Kenyan environmental and political activist, first African woman to win the Nobel Peace Prize.",
        earlyLife: "Born in 1940 in Kenya, studied biology in the US and returned to teach at University of Nairobi.",
        pathToInfluence: "Founded the Green Belt Movement in 1977 to combat deforestation and empower women.",
        contributions: "Planted over 30 million trees, advocated for democracy and women's rights in Kenya.",
        symbolicPower: "Connected environmental protection with social justice and women's empowerment.",
        culturalContext: "Worked during Kenya's transition to multiparty democracy and growing environmental awareness.",
        legacy: "Her work continues through the Green Belt Movement and inspires global environmental activism.",
        sources: [
            { type: "Primary", title: "Maathai's autobiography", title: "Unbowed", year: 2006 },
            { type: "Secondary", title: "Wangari Maathai: The Woman Who Planted Millions of Trees", author: "Franck Prévot", year: 2009 }
        ],
        relatedWomen: [],
        relatedMovements: ["Environmental Justice", "African Feminism"],
        relatedDynasties: []
    }
];

// Categories for filtering
const categories = [
    "Leadership",
    "Culture & Arts",
    "Spirituality & Faith",
    "Politics & Governance",
    "Science & Innovation",
    "Community Builders",
    "Activism & Justice",
    "Education",
    "Diaspora Stories"
];

// Regions for filtering
const regions = [
    "Africa",
    "Europe",
    "Asia",
    "Middle East",
    "North America",
    "South America",
    "Oceania",
    "Antarctica",
    "Global / Diaspora"
];

// Eras for filtering
const eras = [
    "Pre-colonial",
    "Colonial",
    "Post-colonial",
    "Contemporary"
];

// Featured collections
const featuredCollections = [
    {
        id: "women-of-the-pcn",
        title: "Women of the Presbyterian Church of Nigeria",
        description: "Spiritual leadership, cultural negotiation, and the evolution of women's roles in faith communities.",
        biographies: [1, 2]
    },
    {
        id: "missionary-encounters",
        title: "Missionary Encounters",
        description: "Women at the crossroads of culture, faith, and historical transformation.",
        biographies: [1]
    },
    {
        id: "indigenous-matriarchs",
        title: "Indigenous Matriarchs",
        description: "Women whose authority is rooted in land, lineage, and ancestral knowledge.",
        biographies: []
    },
    {
        id: "african-queens",
        title: "African Queens & Kingdom Mothers",
        description: "Sovereigns, strategists, and state-builders whose power reshaped continents.",
        biographies: [3]
    },
    {
        id: "hidden-figures-science",
        title: "Hidden Figures of Science & Innovation",
        description: "Brilliant minds whose discoveries shaped the world despite erasure.",
        biographies: [4]
    },
    {
        id: "environmental-stewardship",
        title: "Environmental Stewardship",
        description: "Guardians of land, water, and the future of the planet.",
        biographies: [5]
    }
];

// Static filter data for fallback when API is unavailable
// This is used by browse-logic.js when the Strapi API fails
const staticFilters = {
    eras: eras.map(era => ({ slug: era.toLowerCase().replace(/\s+/g, '-'), name: era })),
    regions: regions.map(region => ({ slug: region.toLowerCase().replace(/\s+/g, '-'), name: region })),
    categories: categories.map(category => ({ slug: category.toLowerCase().replace(/\s+/g, '-'), name: category }))
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { biographies, categories, regions, eras, featuredCollections, staticFilters };
}