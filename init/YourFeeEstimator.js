import { ConfirmationTarget, FeeEstimator } from "lightningdevkit";

class YourFeeEstimator extends FeeEstimator {
  get_est_sat_per_1000_weight(conf_target) {
    switch (conf_target) {
      case ConfirmationTarget.LDKConfirmationTarget_Background:
        // insert code to retireve a background feerate
        return rpc.estimateSmartFee(6, console.log)
        break;
      case ConfirmationTarget.LDKConfirmationTarget_Normal:
        // <insert code to retrieve a normal (i.e. within ~6 blocks) feerate>
        return rpc.estimateSmartFee(6, console.log)
        break;
      case ConfirmationTarget.LDKConfirmationTarget_HighPriority:
        // <insert code to retrieve a high-priority feerate>
        return rpc.estimateSmartFee(1, console.log)
        break;
      default:
        return 253;
    }
  }
}

export default YourFeeEstimator;
