
import router from "../utils/router.js";
import store from "../utils/store.js";

const Login = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4 border rounded-3 ">
        <h3 class="card-title text-center mb-4">Login</h3>
        <div class="form-group mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required/>
        </div>
        <div class="form-group mb-4">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required/>
        </div>
        <button class="btn btn-primary w-100" @click="submitInfo">Submit</button>
      </div>
    </div>
  `,
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async submitInfo() {
      const url = window.location.origin;
      //const url = `${origin}/user-login`;
      const res = await fetch(url + "/user-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: this.email, password: this.password }),
        //credentials: "same-origin", // Include credentials (cookies) with the request
      });

      if (res.ok) {
        //store.commit("setLogin");
        const data = await res.json();

        console.log(store.state.loggedIn);
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("email", data.email);
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("user_id", data.id);

        console.log(sessionStorage.getItem("role"));

        // add data to vuex
        this.$store.commit("setRole", data.role);
        this.$store.commit("setLogin", true);
        // set role also

        if (data.role === 'cust') {
          router.push("/cust-dashboard");
        } else if (data.role === 'prof') {
          router.push("/prof-dashboard");
        } else if (data.role === "admin") {
          router.push("/admin-dashboard");
        } else {
          console.error("Invalid role");
        }
        
        //router.push("/cust-dashboard");
      } else if (res.status === 403) {
        alert("Your account is blocked. Please contact support.");
        const data = await res.json();
        this.errorMessage = data.message; // Display block message
      } else {
        this.errorMessage = "Login failed. Please check your credentials.";
      }
    },
  },
};

export default Login;


