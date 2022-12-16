import { MANAGEMENT_NODE } from '@shell/config/labels-annotations';
import {
  ADDRESSES, CAPI, MANAGEMENT, NODE, NORMAN
} from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { listNodeRoles } from '@shell/models/cluster/node';
import { insertAt } from '@shell/utils/array';
import { downloadUrl } from '@shell/utils/download';
import findLast from 'lodash/findLast';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class MgmtNode extends HybridModel {
  get _availableActions() {
    const out = super._availableActions;

    const downloadKeys = {
      action:  'downloadKeys',
      enabled: !!this._norman?.links?.nodeConfig,
      icon:    'icon icon-fw icon-download',
      label:   this.t('node.actions.downloadNodeConfig'),
    };

    const scaleDown = {
      action:   'scaleDown',
      enabled:  !!this.canScaleDown,
      icon:     'icon icon-minus icon-fw',
      label:    this.t('node.actions.scaleDown'),
      bulkable: true,
    };

    insertAt(out, 0, { divider: true });
    insertAt(out, 0, downloadKeys);
    insertAt(out, 0, scaleDown);

    return out;
  }

  get kubeNodeName() {
    return this.metadata.labels[MANAGEMENT_NODE.NODE_NAME];
  }

  get mgmtClusterId() {
    return this.id.substring(0, this.id.indexOf('/'));
  }

  get kubeNodeDetailLocation() {
    return this.kubeNodeName ? {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  this.mgmtClusterId,
        product:  EXPLORER,
        resource: NODE,
        id:       this.kubeNodeName
      }
    } : null;
  }

  get isWorker() {
    return this.spec.worker;
  }

  get isControlPlane() {
    return this.spec.controlPlane;
  }

  get isEtcd() {
    return this.spec.etcd;
  }

  get roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  }

  get pool() {
    const nodePoolID = this.spec.nodePoolName.replace(':', '/');

    return this.$rootGetters['management/byId'](MANAGEMENT.NODE_POOL, nodePoolID);
  }

  get _norman() {
    const id = this.id.replace('/', ':');

    return this.$rootGetters['rancher/byId'](NORMAN.NODE, id);
  }

  get canDelete() {
    return this._norman?.hasLink('remove');
  }

  get canUpdate() {
    return this.hasLink('update') && this._norman?.hasLink('update');
  }

  remove() {
    return this._norman?.remove();
  }

  downloadKeys() {
    const url = this._norman?.links?.nodeConfig;

    if ( url ) {
      downloadUrl(url);
    }
  }

  async scaleDown(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node._norman?.doAction('scaledown');
    }));
  }

  get provisioningCluster() {
    return this.$getters['all'](CAPI.RANCHER_CLUSTER).find(c => c.mgmtClusterId === this.mgmtClusterId);
  }

  get doneOverride() {
    return this.provisioningCluster?.detailLocation;
  }

  get canClone() {
    return false;
  }

  get internalIp() {
    // This shows in the IP address column for RKE1 nodes in the
    // list of nodes in the cluster detail page of Cluster Management.

    const internal = this.status?.addresses?.find(({ type }) => {
      return type === ADDRESSES.INTERNAL_IP;
    });

    if (internal) {
      return internal.address;
    }

    // For RKE1 clusters in EC2, node addresses are
    // under status.rkeNode.address and status.rkeNode.internalAddress
    if (!internal && this.status.rkeNode) {
      return this.status.rkeNode.internalAddress;
    }

    return this.t('generic.none');
  }

  get externalIp() {
    const addresses = this.status?.addresses || [];
    const statusAddress = findLast(addresses, address => address.type === 'ExternalIP')?.address;

    if (statusAddress) {
      return statusAddress;
    }

    // For RKE1 clusters in EC2, node addresses are
    // under status.rkeNode.address and status.rkeNode.internalAddress
    if (!statusAddress && this.status.rkeNode) {
      return this.status.rkeNode.address;
    }

    return this.t('generic.none');
  }

  get canScaleDown() {
    const isInOnlyPool = this.pool?.provisioningCluster?.pools?.length === 1;
    const isOnlyNode = this.pool?.nodes?.length === 1;
    const hasAction = this._norman?.actions?.scaledown;

    return hasAction && (!isInOnlyPool || !isOnlyNode);
  }
}
