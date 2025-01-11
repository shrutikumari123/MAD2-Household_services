//import ServiceFields from "../components/ServiceFields.js";

const ProfDashboard = {
  template: `<div>
    <h1>This is prof dashboard</h1>
    <h2>Booked Requests</h2>
    <div v-if="bookedRequests.length === 0">
      <p>No booked requests available.</p>
    </div>
    <div v-else>
      <div v-for="(request, index) in bookedRequests" :key="request.service_request_id + '-' + index" class="request-card">
          <h5>Service ID: {{ request.service_request_id }}</h5>
          <p>Customer Name: {{ request.customer_name }}</p>
          <p>Address: {{request.address}}</p>
          <p>Postal Code: {{request.postal_code}}</p>
          <p>Status: {{ request.status }}</p>
          <p>Booking Time: {{ request.booking_time }}</p>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button v-if="request.status === 'requested'" @click="updateRequestStatus(request.service_request_id, 'accepted')">Accept</button>
            <button v-if="request.status === 'requested'" @click="updateRequestStatus(request.service_request_id, 'rejected')">Reject</button>
            <button v-if="request.status === 'accepted'" @click="updateRequestStatus(request.service_request_id, 'closed')">Close</button>
            <button v-if="request.status === 'closed'" disabled>Closed</button>
          </div>
      </div>
    </div>
 
  </div>`,

  data() {
    return {
      bookedRequests: [],
    };
  },
  async mounted() {
    await this.fetchBookedRequests();
  },
  methods: {
    async fetchBookedRequests() {
      const professionalId = sessionStorage.getItem("user_id"); // Assuming the user_id is the professional's ID
      if (!professionalId) {
        console.error("Error: Professional ID not found in sessionStorage.");
        return;
      }

      console.log("Professional ID: ", professionalId); // Check if the correct ID is being fetched
      try {
        const res = await fetch(`${window.location.origin}/api/booked-requests/${professionalId}`, {
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
        console.log("Response Status:", res.status); // Log status
        const data = await res.json();
        console.log("Response Data:", data); // Log response data

        if (res.ok) {
          this.bookedRequests = data;
          console.log("Booked Requests: ", this.bookedRequests);
        } else {
          console.error("Failed to fetch booked requests.");
        }
      } catch (error) {
        console.error("Error fetching booked requests:", error);
      }
    },

    async updateRequestStatus(serviceRequestId, newStatus) {
      if (!serviceRequestId || !newStatus) {
        console.error("Missing service request ID or status. Aborting request.");
        return;
      }
      
      console.log("Service Request ID:", serviceRequestId); // Debug: Ensure correct ID
      console.log("New Status:", newStatus); // Debug: Ensure correct status
      try {
        const res = await fetch(`${window.location.origin}/api/update-service-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "Authentication-Token": sessionStorage.getItem("token"),
          },
          body: JSON.stringify({ service_request_id: serviceRequestId, status: newStatus }),
        });

        const responseData = await res.json();
        console.log("Response Status:", res.status); // Log status
        console.log("Response Data:", responseData); // Log response data

        if (res.ok) {
          // Update the local state based on the new status
          this.bookedRequests = this.bookedRequests.map(request =>
            request.service_request_id === serviceRequestId ? { ...request, status: newStatus } : request
          );
        } else {
          console.error("Failed to update request status.");
        }
      } catch (error) {
        console.error("Error updating request status:", error);
      }
    },
  },
};
const style = document.createElement("style");
  style.textContent = `
    .request-card {
      border: 1px solid #ccc;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .action-buttons button {
      margin-right: 10px;
    }
  `;


export default ProfDashboard;