# Auth Providers

## Keycloak
Use the steps below to set up a Keycloak instance for dev environments.

1. Bring up a local Keycloak instance in docker using the instructions at [here](https://www.keycloak.org/getting-started/getting-started-docker).
   > Ensure that the admin user has a first name, last name and email. These fields are referenced in the Keycloak client's mappers which are then referenced in the Rancher's auth provider config.
1. Using either the Ember or Vue UI set up the Keycloak auth provider by follow the instructions at [here](https://rancher.com/docs/rancher/v2.x/en/admin-settings/authentication/keycloak/)
   > Double check the client has the correct checkboxes set, specifically the Mappers `group` entry.

   > For the SAML Metadata, export the Client in the Keycloack UI via the `Installation` tab as `SAML Metadata SPSSODescriptor` and then follow the `NOTE` instructions regarding `EntitiesDescriptor` and `EntityDescriptor`. For a better set of instructions see [step 6](https://gist.github.com/PhilipSchmid/506b33cd74ddef4064d30fba50635c5b).
   
   > For key and cert files, export the Client in the Keycloak UI via the `Clients` list page and extract & wrap the `saml.signing.certificate` and `saml.signing.private.key` as cert files (see [step 5](https://gist.github.com/PhilipSchmid/506b33cd74ddef4064d30fba50635c5b) for more info). 