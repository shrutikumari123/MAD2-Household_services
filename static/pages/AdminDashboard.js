import ServiceFields from "../components/ServiceFields.js";

const AdminDashboard = {
  template: `<div>
              <h1>This is Admin dashboard</h1>
              <h2>Create New Service</h2>
              <div class="card shadow-sm p-4 mb-4">
                <form @submit.prevent="createService">
                  <div class="form-group mb-3">
                    <label>Name:</label>
                    <input v-model="newService.ser_name" required />
                  </div>
                  <div class="form-group mb-3">
                    <label>Price:</label>
                    <input v-model="newService.price" required />
                  </div>
                  <div class="form-group mb-3">
                    <label>Time Required:</label>
                    <input v-model="newService.time_required" required />
                  </div>
                  <div class="form-group mb-3">
                    <label>Description:</label>
                    <textarea v-model="newService.description" required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">Create Service</button>
                </form>
              </div>

              <h2>New Services</h2>
              <div v-for="res in newResources" >
                <ServiceFields :ser_name="res.ser_name" :price="res.price" :time_required="res.time_required" 
                :description="res.description" :professionalId="res.professional_id"
                :approvalRequired='true' :approvalID='res.id' @editService="editService(res)" @deleteService="deleteService(res.id)"/>
              </div>
              
              <h2>Approved Services</h2>
              <div v-for="resource in allResources" > 
                <ServiceFields :ser_name="resource.ser_name" :price="resource.price" :time_required="resource.time_required" 
                :description="resource.description" :professionalId="resource.professional_id"/>
              </div>

              <h2> Professionals </h2> 
              <div v-for="user in professionals" :key="user.id" class="justify"> 
                <span> Email: {{user.email}} </span> 
                <span v-if="user.is_active">
                  <button class="btn btn-danger" @click="block(user.id)">Block</button>
                </span>
                <span v-else>
                  <button class="btn btn-secondary" @click="activate(user.id)">Activate</button>
                </span>
              </div>


              <h2>Customers</h2>
              <div v-for="customer in customers" :key="customer.id" class="justify">
                <span>Email: {{ customer.email }}</span>
                <span v-if="customer.is_active">
                  <button class="btn btn-danger" @click="blockCustomer(customer.id)">Block</button>
                </span>
                <span v-else>
                  <button class="btn btn-secondary" @click="activateCustomer(customer.id)">Activate</button>
                </span>
              </div>

              
          </div>`,
  data() {
    return {
      allResources: [],
      newResources:[],
      professionals:[],
      customers: [],
      newService: {
        ser_name: "",
        price: "",
        time_required: "",
        description: "",
      },
      editingService: null,
    };
  },
  async mounted() {
    await this.fetchProfessionals();
    await this.fetchCustomers();
    await this.fetchResources();
    await this.fetchUnapprovedResources();
  },

  methods: {
    async fetchResources() {
      const res = await fetch(window.location.origin + "/api/resources", {
        headers :{
          "Authentication-Token": sessionStorage.getItem("token"),
        },
      });
      try{
        const data = await res.json();
        this.allResources = data;
      }
      catch(e){
        console.log('error in converting to json');
      }
    },

    //unapproved resources api call
    async fetchUnapprovedResources() {
      const resNew = await fetch(window.location.origin + "/api/resources/unapproved", {
        headers :{
          "Authentication-Token": sessionStorage.getItem("token"),
        },
      });
      try{
        const data = await resNew.json();
        this.newResources = data;
      }
      catch(e){
        console.log('error in converting to json');
      }
      //this.inactive();
    },
  
    async fetchProfessionals() {
      // Fetch both active and inactive professionals
      const res = await fetch(window.location.origin + "/professionals", {
        headers: {
          "Authentication-Token": sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        this.professionals = await res.json();
      } else {
        console.log("Failed to fetch professionals.");
      }
    },

    async fetchCustomers() {
      try {
        const res = await fetch(window.location.origin + "/api/customers", {
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
    
        if (res.ok) {
          this.customers = await res.json();
          console.log("Fetched customers:", this.customers); // Debug log
        } else {
          console.error("Failed to fetch customers. Status:", res.status);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    },
    

    async blockCustomer(customerId) {
      try {
        const res = await fetch(window.location.origin + `/api/block-customer/${customerId}`, {
          method: "POST",
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
    
        if (res.ok) {
          alert("Customer blocked successfully!");
          await this.fetchCustomers(); // Refresh the customer list
        } else {
          // Handle non-JSON or error response
          const errorMessage = res.status === 400 || res.status === 404
            ? await res.text()  // Read the response as text
            : "An unexpected error occurred.";
          console.error("Failed to block customer. Status:", res.status, "Message:", errorMessage);
          alert(errorMessage);
        }
      } catch (error) {
        console.error("Error blocking customer:", error);
      }
    },
    
    async activateCustomer(customerId) {
      try {
        const res = await fetch(window.location.origin + `/api/activate-customer/${customerId}`, {
          method: "POST",
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
    
        if (res.ok) {
          alert("Customer activated successfully!");
          await this.fetchCustomers(); // Refresh the customer list
        } else {
          console.error("Failed to activate customer. Status:", res.status);
        }
      } catch (error) {
        console.error("Error activating customer:", error);
      }
    },
    

    async createService() {
      if (this.editingService) {
        // If we're editing a service, we need to update instead of creating a new one
        this.updateService();
      } else {
        try {
          const res = await fetch(window.location.origin + "/api/resources", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": sessionStorage.getItem("token"),
            },
            body: JSON.stringify(this.newService),
          });
          if (res.ok) {
            alert("Service created successfully!");

            // Optionally, reset the form
            this.newService = {
              ser_name: "",
              price: "",
              time_required: "",
              description: "",
            };
            // Reload the services
            await this.fetchResources();  // Call fetchResources instead of this.mounted()
            await this.fetchUnapprovedResources();  // Optionally refresh unapproved resources too
            //this.mounted();
          } else {
            console.log("Failed to create the service.");
          }
        } catch (error) {
          console.log("Error while creating service:", error);
        }
      }
    },

    async editService(service) {
      // Fill form fields with service data to edit
      this.newService = { ...service };
      this.editingService = service;  // Set the service we're editing
    },

    async updateService() {
      try {
        const res = await fetch(window.location.origin + `/api/edit_service/${this.editingService.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": sessionStorage.getItem("token"),
          },
          body: JSON.stringify(this.newService),
        });
        if (res.ok) {
          alert("Service updated successfully!");
          this.editingService = null; // Clear editing state
          this.newService = { name: "", price: "", time_required: "", description: "" };  // Reset form
          await this.fetchResources();  // Call fetchResources instead of this.mounted()
        } else {
          console.log("Failed to update the service.");
        }
      } catch (error) {
        console.log("Error while updating service:", error);
      }
    
    },

    async deleteService(serviceId) {
      try {
        const res = await fetch(window.location.origin + "/api/delete_service/" + serviceId, {
          method: "DELETE",
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
        if (res.ok) {
          alert("Service deleted successfully!");
          await this.fetchResources();  
        } else {
          console.log("Failed to delete the service.");
        }
      } catch (error) {
        console.log("Error while deleting service:", error);
      }
    },
    
    // Other methods like activate and inactive remain unchanged...

    async activate(id) {
      const res = await fetch(window.location.origin + "/activate-prof/" + id, {
        headers: {
          "Authentication-Token": sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("prof activated");
        this.fetchProfessionals();
      }
    },

    async block(id) {
      // Call the backend to block the professional (set active = false)
      const res = await fetch(window.location.origin + "/block-prof/" + id, {
        method: "POST",
        headers: {
          "Authentication-Token": sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("Professional blocked!");
        this.fetchProfessionals(); // Refresh the list after blocking
      }
    },
  },
  components: { ServiceFields },
};
  
export default AdminDashboard;