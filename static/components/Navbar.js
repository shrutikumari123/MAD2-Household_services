import store from "../utils/store.js";
import router from "../utils/router.js";
//import Logout from "../pages/Logout.js";

const Navbar = {
    template : `
    <nav class="h3 w-auto d-flex justify-content-between">
        <router-link to='/'>Home</router-link>
        <router-link v-if="state.loggedIn" to='/profile'>Profile</router-link>
        <router-link v-if="!state.loggedIn" to='/login'>Login</router-link>
        <router-link v-if="!state.loggedIn" to='/signup'>Signup</router-link>
        <router-link v-if="state.loggedIn && state.role ==='prof'" to='/prof-dashboard'>ProfDashboard</router-link>
        <router-link v-if="state.loggedIn && state.role ==='cust'" to='/cust-dashboard'>CustDashboard</router-link>
        <router-link v-if="state.loggedIn && state.role ==='admin'" to='/admin-dashboard'>AdminDashboard</router-link>
        <router-link v-if="state.loggedIn && state.role ==='cust'" to='/search'>Search</router-link>
        <router-link v-if="state.loggedIn && state.role ==='admin'" to='/search-professional'>prof_search</router-link>
        <a @click='logout'>Logout</a>
    </nav>
    `,
    data() {
        return {
            //loggedIn: store.state.loggedIn,
            url: window.location.origin + "/logout",
        };
    },
    computed:{
        state(){
            return this.$store.state;
        },
    },
    methods :{
        logout(){
            sessionStorage.clear();

            this.$store.commit("logout");
            this.$store.commit("setRole",null);
            router.push('/home');
        },
    },
};

export default Navbar;