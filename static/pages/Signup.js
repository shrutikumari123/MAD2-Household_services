import router from "../utils/router.js";

const Signup = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4">
        <h3 class="card-title text-center mb-4">Sign Up</h3>
        <div class="form-group mb-3">
          <input v-model="username" type="text" class="form-control" placeholder="Username" required/>
        </div>
        <div class="form-group mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required/>
        </div>
        <div class="form-group mb-4">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required/>
        </div>
        <div class="form-group mb-4">
          <select v-model="role" class="form-control">
            <option value="prof">Professional</option>
            <option value="cust">Customer</option>
          </select>
        </div>
        
        <button class="btn btn-primary w-100" @click="submitInfo">Submit</button>
      </div>
    </div>
  `,
  data() {
    return {
      username: "",
      email: "",
      password: "",
      role: "",
      date_created: "",
    };
  },
  methods: {
    async submitInfo() {
      const origin = window.location.origin;
      const url = `${origin}/register`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: this.username,
          email: this.email,
          password: this.password,
          role: this.role,
          date_created: this.date_created ? new Date(this.date_created).toISOString() : undefined,
        }),
        credentials: "same-origin",
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        // Handle successful sign-up and redirection
        if (data.redirect === 'professional-signup') {
          console.log(`Redirecting to professional signup with user_id: ${data.user_id}`);
          router.push(`/professional-signup/${data.user_id}`);
        } else if (data.redirect === 'customer-signup') {
          console.log(`Redirecting to customer signup with user_id: ${data.user_id}`);
          router.push(`/customer-signup/${data.user_id}`);
        }
      } else {
        const errorData = await res.json();
        console.error("Sign up failed:", errorData);
        // Handle sign up error
      }
    },
  },
};

export default Signup;