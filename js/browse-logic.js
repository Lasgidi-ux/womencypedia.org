/* ================= CONFIG ================= */

const STRAPI_URL = typeof CONFIG !== 'undefined' ? `${CONFIG.API_BASE_URL}/api` : "https://womencypedia-cms.onrender.com/api"

let currentPage = 1
let pageSize = 9

let filters = {}
let searchQuery = ""

let dynamicFilters = {
    eras: [],
    regions: [],
    categories: []
}

let usingStaticData = false
let browseLogicErrorCount = 0
const MAX_API_ERRORS = 3


/* ================= API ================= */

const API = {

    async fetch(endpoint, params = {}) {

        const url = new URL(`${STRAPI_URL}/${endpoint}`)

        Object.keys(params).forEach(key => {

            if (params[key] !== undefined && params[key] !== null) {

                url.searchParams.append(key, params[key])

            }

        })

        const res = await fetch(url)

        if (!res.ok) {

            throw new Error(`API error ${res.status}`)

        }

        return res.json()

    },



    collections: {

        async getAll({ type }) {

            const res = await API.fetch("collections", {

                "filters[type][$eq]": type,
                "pagination[limit]": 100
            })

            return {

                entries: res.data.map(item => ({

                    id: item.id,
                    name: item.attributes.name,
                    slug: item.attributes.slug

                }))

            }

        }

    },



    biographies: {

        async getAll({

            page = 1,
            pageSize = 9,
            filters = {},
            search = "",
            sort = "name",
            order = "asc"

        }) {

            let params = {

                "pagination[page]": page,
                "pagination[pageSize]": pageSize,
                "sort": `${sort}:${order}`,
                "populate": "image"

            }


            if (search) {

                params["filters[name][$containsi]"] = search

            }


            if (filters.era) {

                params["filters[era][slug][$eq]"] = filters.era.slug

            }

            if (filters.region) {

                params["filters[region][slug][$eq]"] = filters.region.slug

            }

            if (filters.category) {

                params["filters[category][slug][$eq]"] = filters.category.slug

            }


            const res = await API.fetch("biographies", params)


            return {

                entries: res.data.map(item => ({

                    id: item.id,

                    name: item.attributes.name,

                    summary: item.attributes.summary,

                    image: item.attributes.image?.data?.attributes?.url
                        ? { url: STRAPI_URL.replace("/api", "") + item.attributes.image.data.attributes.url }
                        : null,

                    era: item.attributes.era?.data?.attributes?.slug,

                    region: item.attributes.region?.data?.attributes?.slug,

                    category: item.attributes.category?.data?.attributes?.slug

                })),

                pagination: {

                    page: res.meta.pagination.page,

                    pageCount: res.meta.pagination.pageCount,

                    total: res.meta.pagination.total

                }

            }

        }

    }

}



/* ================= LOAD FILTER OPTIONS ================= */

async function loadFilterOptions() {

    try {

        const eras = await API.collections.getAll({ type: "era" })

        const regions = await API.collections.getAll({ type: "region" })

        const categories = await API.collections.getAll({ type: "category" })


        dynamicFilters.eras = eras.entries

        dynamicFilters.regions = regions.entries

        dynamicFilters.categories = categories.entries


        populateDropdown("eraFilter", dynamicFilters.eras, "Era")

        populateDropdown("regionFilter", dynamicFilters.regions, "Region")

        populateDropdown("categoryFilter", dynamicFilters.categories, "Category")

    }

    catch (e) {

        console.error("Filter load error:", e)

        usingStaticData = true

        loadStaticFilterOptions()

    }

}



/* ================= STATIC FILTER FALLBACK ================= */

function loadStaticFilterOptions() {

    if (!staticFilters) return


    populateDropdown("eraFilter", staticFilters.eras, "Era")

    populateDropdown("regionFilter", staticFilters.regions, "Region")

    populateDropdown("categoryFilter", staticFilters.categories, "Category")

}



/* ================= DROPDOWN ================= */

function populateDropdown(id, data, label) {

    const el = document.getElementById(id)

    if (!el) return


    el.innerHTML = `<option value="">${label}</option>`


    data.forEach(item => {

        el.innerHTML += `

        <option value="${item.slug}">

        ${item.name}

        </option>

        `

    })

}



/* ================= LOAD ENTRIES ================= */

async function loadEntries() {

    try {

        const res = await API.biographies.getAll({

            page: currentPage,

            pageSize,

            filters,

            search: searchQuery,

            sort: "name"

        })


        renderEntries(res.entries, "entries-grid")

        updatePagination(res.pagination)

    }

    catch (e) {

        console.error("Entries load error:", e)

        usingStaticData = true

        loadStaticEntries()

    }

}



/* ================= STATIC FALLBACK ================= */

function loadStaticEntries() {

    let data = biographies


    if (filters.era) {

        data = data.filter(x => x.era === filters.era.slug)

    }

    if (filters.region) {

        data = data.filter(x => x.region === filters.region.slug)

    }

    if (filters.category) {

        data = data.filter(x => x.category === filters.category.slug)

    }


    if (searchQuery) {

        const q = searchQuery.toLowerCase()

        data = data.filter(x =>

            x.name.toLowerCase().includes(q) ||

            x.summary?.toLowerCase().includes(q)

        )

    }


    const start = (currentPage - 1) * pageSize

    const paginated = data.slice(start, start + pageSize)


    renderEntries(paginated, "entries-grid")


    updatePagination({

        page: currentPage,

        pageCount: Math.ceil(data.length / pageSize),

        total: data.length

    })

}



/* ================= RENDER ================= */

function renderEntries(entries, containerId) {

    const el = document.getElementById(containerId)

    if (!el) return


    if (!entries.length) {

        el.innerHTML = `

        <p class="col-span-full text-center text-gray-500">

        No results found

        </p>

        `

        return

    }


    el.innerHTML = entries.map(item => {

        const image = item.image?.url ||

            "https://via.placeholder.com/400x300"


        return `

        <a href="profile.html?id=${item.id}"

        class="bg-white rounded-xl border overflow-hidden hover:shadow">

        <div

        class="h-48 bg-cover bg-center"

        style="background-image:url('${image}')">

        </div>


        <div class="p-4">

        <h3 class="font-semibold">

        ${item.name}

        </h3>


        <p class="text-sm text-gray-500">

        ${item.summary || ""}

        </p>


        </div>

        </a>

        `

    }).join("")

}



/* ================= FILTER ================= */

function applyFilters() {

    filters = {}

    const era = document.getElementById("eraFilter")?.value

    const region = document.getElementById("regionFilter")?.value

    const category = document.getElementById("categoryFilter")?.value


    if (era) filters.era = { slug: era }

    if (region) filters.region = { slug: region }

    if (category) filters.category = { slug: category }


    currentPage = 1

    loadEntries()

}



function resetFilters() {

    filters = {}

    searchQuery = ""

    currentPage = 1


    document.getElementById("searchInput").value = ""

    document.getElementById("eraFilter").value = ""

    document.getElementById("regionFilter").value = ""

    document.getElementById("categoryFilter").value = ""


    loadEntries()

}



/* ================= SEARCH ================= */

function applySearch() {

    searchQuery = document.getElementById("searchInput").value

    currentPage = 1

    loadEntries()

}



/* ================= PAGINATION ================= */

function changePage(direction) {

    currentPage += direction

    if (currentPage < 1) currentPage = 1

    loadEntries()

}



function updatePagination(meta) {

    document.getElementById("pageInfo").innerText =

        `Page ${meta.page} of ${meta.pageCount}`


    document.getElementById("prevPage").disabled = meta.page === 1

    document.getElementById("nextPage").disabled =

        meta.page === meta.pageCount

}



/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    loadFilterOptions()

    loadEntries()

})