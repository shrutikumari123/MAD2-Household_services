const Search = {
    template: `
        <div class="search-container">
            <h2>Search Functionality</h2>
            <label>Search by:</label>
            <select v-model="searchBy">
                <option value="service_name">Service Name</option>
                <option value="pin_code">Pin Code</option>
                <option value="address">Address</option>
                <!-- Add more search options as needed -->
            </select>
            <input type="text" v-model="searchText" placeholder="Enter search text (e.g., Salon)" />
            <button @click="performSearch">Search</button>
            <div v-if="results.length > 0">
                <h3>Search Results:</h3>
                <ul>
                    <li v-for="result in results" :key="result.service_name">
                        Search Name: {{ result.service_name }} , Professional Name: {{ result.professional_name }} , Price: {{ result.price }} , Description: {{ result.description }}
                    </li>
                </ul>
            </div>
        </div>
    `,
    data() {
        return {
            searchBy: 'service_name',
            searchText: '',
            results: [],
        };
    },
    methods: {
        async performSearch() {
            console.log("Performing search with:", this.searchBy, this.searchText);  // Log the search parameters
            try {
                const response = await fetch(`/api/search_services?search_by=${this.searchBy}&search_text=${this.searchText}`);
                if (response.ok) {
                    this.results = await response.json();
                    console.log("Search results:", this.results);  // Log the results
                } else {
                    console.error("Error fetching search results.");
                }
            } catch (error) {
                console.error("Error:", error);
            }
        },
    },
};

export default Search;
