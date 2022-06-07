import { ConfirmationTarget, FeeEstimator } from "lightningdevkit";

class YourFeeEstimator extends FeeEstimator {
  get_est_sat_per_1000_weight(conf_target) {
    return 253;
    // if (conf_target == ConfirmationTarget.LDKConfirmationTarget_Background) {
    //   // insert code to retireve a background feerate
    // } else if (conf_target == ConfirmationTarget.LDKConfirmationTarget_Normal) {
    //   // <insert code to retrieve a normal (i.e. within ~6 blocks) feerate>
    // } else if (
    //   conf_target == ConfirmationTarget.LDKConfirmationTarget_HighPriority
    // ) {
    //   // <insert code to retrieve a high-priority feerate>
    // }
  }
}

export default YourFeeEstimator;
