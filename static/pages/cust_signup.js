import router from "../utils/router.js";

const cust_signup = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4">
        <h3 class="card-title text-center mb-4">Sign Up</h3>
        <div class="form-group mb-3">
          <input v-model="cust_address" type="text" class="form-control" placeholder="Cust_Address" required/>
        </div>
        <div class="form-group mb-3">
          <input v-model="cust_postal_code" type="text" class="form-control" placeholder="Cust_Postal_code"/>
        </div>
        <button class="btn btn-primary w-100" @click="submitInfo">Submit</button>
      </div>
    </div>
  `,
  data() {
    return {
      user_id: "",
      cust_address: "",
      cust_postal_code: "",
    };
  },
  mounted() {
    // Retrieve user_id from the route params
    this.user_id = this.$route.params.user_id;
    console.log(`User ID in cust_signup: ${this.user_id}`);  // Log to ensure user_id is retrieved
  },
  methods: {
    async submitInfo() {
      const origin = window.location.origin;
      const url = `${origin}/customer-signup`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: this.user_id,
          cust_address: this.cust_address,
          cust_postal_code: this.cust_postal_code,
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
    },
  },
};

export default cust_signup;