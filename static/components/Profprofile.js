const ProfessionalProfile = {
    template: `
      <div>
        <h1>Professional Profile</h1>
        <p>Name: {{ professional.prof_name }}</p>
        <p>Service Type: {{ professional.service_type }}</p>
        <p>Experience: {{ professional.experience }} years</p>
        <p>Description: {{ professional.description }}</p>
      </div>
    `,
    data() {
      return {
        professional: {},
      };
    },
    mounted() {
      const professionalId = this.$route.params.professionalId;
      // Fetch professional details using professionalId
      fetch(`/api/professional/${professionalId}`)
        .then(response => response.json())
        .then(data => {
          this.professional = data;
        });
    },
  };
  
  export default ProfessionalProfile;
  