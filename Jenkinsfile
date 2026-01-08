pipeline {
    agent any
    environment {
        SITE_ID = credentials('lemon_backend_site_id')
        SITE_AUTH_TOKEN = credentials('auth_token')
    }
    stages {

        stage(Checkout code) {
            steps {

               branch 'devops-branch', url: 'https://github.com/0rphx/lemonbackend.git'

            }
        stage(install dependencies) {
            steps {
                sh 'npm run install'
            }
        stage(deploy){
            steps {
                sh 'netlify deploy --prod --site-id $SITE_ID '
            }
        }

        }
    }