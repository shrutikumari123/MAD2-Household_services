import ServiceFields from "../components/ServiceFields.js";
//import Profprofile from "../components/Profprofile.js";

const CustDashboard = {
  template: `<div>
              <h1>This is Customer dashboard</h1>
              <h2>Book Services</h2>
              <div v-for="(resource, index) in allResource" :key="resource.id + '-' + index"> 
                <ServiceFields :ser_name="resource.ser_name" 
                  :price="resource.price" 
                  :time_required="resource.time_required" 
                  :description="resource.description" 
                  :professionalIds="resource.professional_ids" 
                  :bookable="true" 
                  @book="bookResource(resource, $event)" />
              </div>

              <!-- Services History Section -->
              <h2>Services History</h2>
              <div v-if="serviceHistory.length === 0">
                <p>No service history available.</p>
              </div>
              <div v-else>
                <div v-for="service in serviceHistory" :key="service.id" class="card mb-4 shadow-sm p-4">
                  <div class="card-body">
                    <h5 class="card-title">{{ service.service_type }}</h5>
                    <p class="card-text"><strong>Professional Name:</strong> {{ service.prof_name || "Not Assigned"}}</p>
                    <p class="card-text"><strong>Status:</strong> {{ service.status }}</p>

                    <!-- Show close timing for closed services -->
                    <p v-if="service.status === 'closed'">
                    <strong>date_of_completion:</strong> {{ service.date_of_completion }}</p>

                    <!-- Allow reviews only for closed services -->
                    <div v-if="service.status === 'closed'">
                      <textarea v-model="service.remarks" placeholder="Leave your review"></textarea>
                      <button @click="postReview(service)">Submit Review</button>
                    </div>
                    <!-- Add a Close Request button for accepted services -->
                    <div v-else-if="service.status === 'accepted'">
                      <button @click="closeService(service)">Close Request</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>`,
  data() {
    return {
      allResource: [],
      serviceHistory: [],
    };
  },
  async mounted() {
    // Fetch available services for booking
    await this.fetchResources();
    // Fetch service history
    await this.fetchServiceHistory();
  },
  methods:{
    async fetchResources() {
      try {
        const res = await fetch(window.location.origin + "/api/resources", {
          headers :{
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
        const data = await res.json();
        this.allResource = data;
      } catch (error) {
        console.error("Error fetching resources:", error);
      }
    },
    async bookResource(resource, selectedProfessional = null) {
      const userId = sessionStorage.getItem("user_id");
      //const professionalId = resource.professional_id || null; // Default to null if no professional assigned
      const professionalId = selectedProfessional ? selectedProfessional.id : null;

      console.log("Retrieved id:", userId); // Check if the user_id is correctly retrieved
      console.log("Booking service_id:", resource.id); // Debugging info
      console.log("Booking professional_id:", professionalId ? professionalId : "No professional assigned"); // Debugging info for professional_id

      if (!professionalId) {
        console.log("No professional assigned, booking cannot proceed.");
        alert("Please select a service that has available professionals.");
        return; // Prevent booking if no professionals are available
      }
      console.log(`Booking service_id: ${resource.id}`);
      console.log("Booking professional_id:", professionalId);
      // You might need to default to some professional_id if not assigned
      //const professionalId = resource.professional_id || null; // Set default if undefined or 0
      // Handle the booking action here, maybe by sending a request to the server
      if (!userId) {
        console.log("user_id is missing!");
        return;
      }
      try {
        const res = await fetch(window.location.origin + "/api/book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": sessionStorage.getItem("token"),
          },
          body: JSON.stringify({
            service_id: resource.id,
            user_id: userId, // Use the correct user_id here
            professional_id: professionalId ,  // Include the professional_id in the booking request
            ser_name: resource.ser_name,
          }),
        });
        //const responseBody = await res.json(); // Capture the response body

        if (res.ok) {
          alert("Service booked successfully!");
          // Refresh the service history after booking
          this.fetchServiceHistory();


        } else {
          console.log("Failed to book the service.");
        }
      } catch (error) {
        console.log("Error while booking service:", error);
      }
    },
    async fetchServiceHistory() {
      try {
        const res = await fetch(window.location.origin + "/api/service-history", {
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
        if (!res.ok) {
          const errorMessage = await res.text(); // Capture error message
          console.error("Failed to fetch service history:", errorMessage);
          return; // Exit if there's an error
        }
        const historyData = await res.json();
        console.log("Service History Data:", historyData); // Log the data to check if prof_name is coming
        this.serviceHistory = historyData;
      } catch (e) {
        console.log("Error fetching service history:", e);
      }
    },
    async closeService(service) {
      const serviceRequestId = service.service_request_id || service.id; // Use the correct identifier
      if (!serviceRequestId) {
        console.error("Service request ID is missing!");
        alert("Cannot close the service request. Please try again.");
        return;
      }

      try {
        const res = await fetch(`/api/service-review/${serviceRequestId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": sessionStorage.getItem("token"),
          },
          body: JSON.stringify({
            action: "close",
          }),
        });
        if (res.ok) {
          alert("Service request closed successfully!");
          // Refresh the service history after closing the request
          await this.fetchServiceHistory();
        } else {
          const errorMessage = await res.text();
          console.error("Failed to close service request:", errorMessage);
          alert("Unable to close the service request.");
        }
      } catch (error) {
        console.error("Error while closing service request:", error);
      }
    },
    async postReview(service) {
      try {
        const res = await fetch(`/api/service-review/${service.service_request_id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": sessionStorage.getItem("token"),
          },
          body: JSON.stringify({
            remarks: service.remarks,
          }),
        });
        if (res.ok) {
          alert("Review posted successfully!");
        } else {
          console.error("Failed to post review.");
        }
      } catch (error) {
        console.error("Error posting review:", error);
      }
    },
    
  },
  components: { ServiceFields },
};
  
export default CustDashboard;