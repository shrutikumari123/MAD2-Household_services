import router from "../utils/router.js";

const prof_signup = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4">
        <h3 class="card-title text-center mb-4">Sign Up</h3>
        <div class="form-group mb-3">
          <input v-model="service_type" type="text" class="form-control" placeholder="Service_type" required/>
        </div>
        <!--<div class="form-group mb-3">
          <input v-model="ser_name" type="text" class="form-control" placeholder="Service Name" required/>
        </div>-->
        <!-- Service Name Dropdown -->
        <div class="form-group mb-3">
          <select v-model="ser_name" class="form-control" required>
            <option disabled value="">Select Service Name</option>
            <option v-for="service in services" :key="service.id" :value="service.name">
              {{ service.name }}
            </option>
          </select>
        </div>
        <div class="form-group mb-3">
          <input v-model="prof_address" type="text" class="form-control" placeholder="Prof_Address" required/>
        </div>
        <div class="form-group mb-3">
          <input v-model="prof_postal_code" type="text" class="form-control" placeholder="Prof_Postal_code" required/>
        </div>
        <div class="form-group mb-4">
          <input v-model="experience" type="integer" class="form-control" placeholder="Experience" required/>
        </div>
        <div class="form-group mb-3">
          <input v-model="description" type="text" class="form-control" placeholder="description"/>
        </div>
        <button class="btn btn-primary w-100" @click="submitInfo">Submit</button>
      </div>
    </div>
  `,
  data() {
    return {
      user_id: "",
      service_id: "",
      ser_name: "",
      service_type: "",
      prof_address: "",
      prof_postal_code: "",
      experience: "",
      description: "",
      services: [],
    };
  },
  mounted() {
    // Retrieve user_id from the route params
    this.user_id = this.$route.params.user_id;
    console.log(`User ID in prof_signup: ${this.user_id}`);  // Log to ensure user_id is retrieved
    this.fetchServices();
  },
  methods: {
    async fetchServices() {
      const origin = window.location.origin;
      try {
        const res = await fetch(`${origin}/get-services`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        });
        if (res.ok) {
          const services = await res.json();
          this.services = services;  // Set the services list in the data
        } else {
          console.error("Failed to fetch services.");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    },
    async submitInfo() {
      const origin = window.location.origin;
      // Fetch service_id based on ser_name
      const serviceRes = await fetch(`${origin}/get-service-id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ser_name: this.ser_name }),
        credentials: "same-origin",
      });

      if (serviceRes.ok) {
        const serviceData = await serviceRes.json();
        this.service_id = serviceData.id; // Set service_id from response

        // Check if service_id is valid
        if (!this.service_id) {
          console.error("Service ID is empty.");
          return; // Prevent further execution if service_id is not valid
        }

      const url = `${origin}/professional-signup`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: this.user_id,
          service_id: this.service_id,
          service_type: this.service_type,
          prof_address: this.prof_address,
          prof_postal_code: this.prof_postal_code,
          experience: parseInt(this.experience),
          description: this.description,
        }),
        credentials: "same-origin",
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        // Handle successful sign up, e.g., redirect or store token
        router.push("/login");
      } else {
        const errorData = await res.json();
        console.error("Sign up failed:", errorData);
        // Handle sign up error
      }
    } else {
      const errorData = await serviceRes.json();
      console.error("Service fetch failed:", errorData);
    }
  },
  },
};

export default prof_signup;