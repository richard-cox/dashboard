import { MANAGEMENT } from '@/config/types';

export default {

  roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateName);
  }
};
