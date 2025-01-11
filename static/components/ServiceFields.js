const ServiceFeilds = {
    template: `
      <div>
        <div class="card shadow-sm p-4 mb-4 service-resource-card" @click="openPopup">
          <div class="card-body">
            <!--<h3 class="card-title text-center mb-3 text-primary text-truncate">{{ name }}</h3>-->
            <p class="card-text text-secondary text-truncate">{{ ser_name }}</p>
            <p class="card-text text-secondary text-truncate">{{ price }}</p>
            <p class="card-text text-secondary text-truncate">{{ time_required }}</p>
          </div>
          <div class="card-footer text-muted text-end">
            <small>Description: {{ description }}</small>
          </div>
        </div>
        
        <!-- Popup for Service Information -->
        <div v-if="showPopup" class=" popup-overlay d-flex align-items-center justify-content-center">
        <div class="popup-content card shadow p-4">
          <h3 class="card-title text-center mb-3 text-primary">{{ ser_name }}</h3>
          <p class="card-text text-secondary">{{ price }}</p>
          <p class="card-text text-secondary">{{ time_required }}</p>
          <div class="text-muted text-end mt-3">
            <small>Description: {{ description }}</small>
          </div>

          <!-- Show Professional Information if available -->
          <h4 v-if="bookable">Professional Details:</h4>
          <div v-if="bookable && professionals.length === 0">
            <p>No professionals available for this service.</p>
          </div>
          <div v-if="bookable && professionals.length > 0">
            <div v-for="(professional, index) in professionals" :key="professional.id + '-' + index" class="mb-3">
              <p><strong>Name:</strong> {{ professional.name }}</p>
              <p><strong>Service_type:</strong> {{ professional.service_type }}</p>
              <p><strong>Experience:</strong> {{ professional.experience }} years</p>
              <p><strong>Description:</strong> {{ professional.description }}</p>
              <hr />

              <button v-if="bookable" class="btn btn-primary mt-3" @click="bookService(professional)">Book {{ professional.name }}</button>
            </div>
          </div>

          <!-- Show Approve button only if approvalRequired is true -->
          <button v-show="approvalRequired" class="btn btn-success mt-3" @click="sendApproval">Approve</button>

          <!-- Show Edit button only if approvalRequired is true (new/unapproved resources) -->
          <button v-show="approvalRequired" class="btn btn-warning mt-3" @click="emitEdit">Edit</button>

          <!-- Show the "Book" button only if bookable is true -->
          <!--<button v-if="bookable" class="btn btn-primary mt-3" @click="bookService">Book</button>-->

          <!-- Delete button is available for both approved and unapproved resources -->
          <button v-show="approvalRequired" class="btn btn-danger mt-3" @click="emitDelete">Delete</button>
          <button class="btn btn-secondary  mt-3" @click="closePopup">Close</button>
        </div>
      </div>
      </div>
    `,
    props: {
      ser_name: {
        type: String,
        required: true,
      },
      price: {
        type: String,
        required: true,
      },
      time_required: {
          type: String,
          required: true,
      },
      description: {
        type: String,
        required: true,
      },
      professionalIds: {
        type: Array,
        //required: true,
        default: () => [],
      },
      approvalRequired: {
        type: Boolean,
        //required: false,
      },
      approvalID: {
        type: Number,
      },
      bookable: {
        type: Boolean,
        default: false, // By default, the Book button won't appear unless explicitly set to true
      },
    },
    data() {
      return {
        showPopup: false,
        professionals: [],  // To hold professional details
      };
    },
    methods: {
      async openPopup() {
        this.showPopup = true;
    
        // Fetch professionals who provide the same service type (ser_name)
        try {
          const res = await fetch(`/api/professional_profiles_by_service/${this.ser_name}`);
          if (res.ok) {
            const data = await res.json();
            console.log("Fetched professional data:", data);
            this.professionals = data; // Store all professionals for this service
          } else {
            console.log("Error fetching professionals for service:", res.status);
          }
        } catch (error) {
          console.log("Error:", error);
        }
      },
      closePopup() {
        this.showPopup = false;
      },
      async sendApproval() {
        const res=fetch(window.location.origin + "/verify-resource/" + this.approvalID, {
          headers:{
            'Authentication-Token': sessionStorage.getItem('token')
          },
        });
        if (res.ok){
          alert('reource verified');
        }
        // send fetch request to approval backend
        console.log("sending Approval");
      },
      emitEdit() {
        this.$emit('editService');  // Emit the edit event to the parent
        this.closePopup();          // Close the popup after emitting
      },
      emitDelete() {
        this.$emit('deleteService');  // Emit the delete event to the parent
        this.closePopup();            // Close the popup after emitting
      },
      bookService(professional) {
        this.$emit("book", professional);  // Emit the book event to the parent
        this.closePopup();    // Close the popup after booking
      },
    },
    mounted() {
      const style = document.createElement("style");
      style.textContent = `
        .service-resource-card {
          max-width: 600px;
          margin: auto;
          border-radius: 15px;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .service-resource-card:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
      `;
      document.head.appendChild(style);
    },
};

export default ServiceFeilds;