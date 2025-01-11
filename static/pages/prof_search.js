const Prof_search = {
    template: `
      <div>
        <h3>Search Professionals</h3>
        
        <!-- Filter Section -->
        <div class="d-flex mb-3">
          <input
            v-model="searchQuery"
            @input="searchProfessionals"
            placeholder="Search by name or email"
            class="form-control me-2"
          />
          <select v-model="filterStatus" @change="filterProfessionals" class="form-select">
            <option value="">All</option>
            <option value="blocked">Blocked</option>
            <option value="unblocked">Unblocked</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
  
        <!-- Professional List -->
        <table class="table mt-3" v-if="filteredProfessionals.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="professional in filteredProfessionals" :key="professional.id">
              <td>{{ professional.name }}</td>
              <td>{{ professional.email }}</td>
              <td>{{ professional.status }}</td>
              <td>{{ professional.remarks }}</td>
            </tr>
          </tbody>
        </table>
  
        <!-- No Professionals Found -->
        <p v-else>No professionals found.</p>
      </div>
    `,
    data() {
      return {
        searchQuery: '', // Search input
        filterStatus: '', // Filter option: 'blocked', 'unblocked', or 'reviewed'
        professionals: [], // All professionals fetched from the server
        filteredProfessionals: [], // Filtered list displayed to the admin
      };
    },
    async mounted() {
      await this.fetchProfessionals(); // Load professionals on component mount
    },
    methods: {
      async fetchProfessionals() {
        try {
          const res = await fetch(`/api/search-professionals`, {
            headers: {
              "Authentication-Token": sessionStorage.getItem("token"),
            },
          });
          if (res.ok) {
            this.professionals = await res.json();
            this.filteredProfessionals = this.professionals; // Default view
          } else {
            console.error("Failed to fetch professionals.");
          }
        } catch (error) {
          console.error("Error fetching professionals:", error);
        }
      },
      searchProfessionals() {
        const query = this.searchQuery.toLowerCase();
        this.filteredProfessionals = this.professionals.filter((prof) => {
          return (
            prof.name.toLowerCase().includes(query) ||
            prof.email.toLowerCase().includes(query)
          );
        });
        this.applyFilterStatus();
      },
      filterProfessionals() {
        this.applyFilterStatus();
      },
      applyFilterStatus() {
        this.filteredProfessionals = this.professionals.filter((prof) => {
          if (this.filterStatus === "blocked") {
            return prof.status === "Blocked";
          }
          if (this.filterStatus === "unblocked") {
            return prof.status === "Unblocked";
          }
          if (this.filterStatus === "reviewed") {
            // Include professionals with remarks other than "No remarks"
            return prof.remarks !== "No remarks";
          }
          return true; // No filter applied
        });
      },
    },
  };
  
  export default Prof_search;
  