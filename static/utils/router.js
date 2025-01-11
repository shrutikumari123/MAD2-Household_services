import store from "./store.js"

// import Navbar from "../components/Navbar.js";
import Home from "../pages/Home.js";
import Login from "../pages/Login.js";
import Signup from "../pages/Signup.js";
import Logout from "../pages/Logout.js";
import prof_signup from "../pages/prof_signup.js";
import cust_signup from "../pages/cust_signup.js";
import ProfDashboard from "../pages/ProfDashboard.js";
import CustDashboard from "../pages/CustDashboard.js";
import AdminDashboard from "../pages/AdminDashboard.js";
import Profile from "../pages/Profile.js";
import Search from "../pages/Search.js";
import prof_search from "../pages/prof_search.js";


const routes = [
    { path :'/', component : Home},
    { path :'/login', component : Login},
    { path :'/signup', component : Signup},
    { path :'/logout', component : Logout},
    {
      path: '/search',
      component: Search, // Replace with your actual search component
    },
    {
      path: '/search-professional',
      component: prof_search, // Replace with your actual search component
    },
    {
        path: '/professional-signup/:user_id',
        name: 'ProfessionalSignup',
        component: prof_signup,
    },
    {
        path: '/customer-signup/:user_id',
        name: 'CustomerSignup',
        component: cust_signup,
    },
    { path: "/prof-dashboard", component: ProfDashboard, meta:{requiresLogin : true, role:"prof"} },
    { path: "/cust-dashboard", component: CustDashboard, meta:{requiresLogin : true, role:"cust"}},
    { path: "/admin-dashboard", component: AdminDashboard, meta:{requiresLogin : true, role:"admin"}},
    { path: "/profile", component: Profile, meta:{requiresLogin : true} },

];

const router = new VueRouter({
    routes,
});

// frontend router protection
router.beforeEach((to, from, next) => {
    //check this
    
    if (to.matched.some((record) => record.meta.requiresLogin)) {
      if (!store.state.loggedIn) {
        next({ path: "/login" });
      } else if (to.meta.role && to.meta.role !== store.state.role) {
        next({ path: "/" });
      } else {
        next();
      }
    } else {
      next();
    }
});

export default router;