import { authApis, endpoints } from "../config/Apis";

class SignatureService {
  static async getUserSignature() {
    const res = await authApis().get(endpoints["user-signature"]);
    return res.data;
  }

  static async saveUserSignature(signatureImage) {
    if (!signatureImage) return null;
    const res = await authApis().post(endpoints["user-signature"], {
      signature_image: signatureImage,
    });
    return res.data;
  }

  static async deleteUserSignature() {
    const res = await authApis().delete(endpoints["user-signature"]);
    return res.data;
  }

  static async approveSyllabus(syllabusId) {
    if (!syllabusId) return null;
    const res = await authApis().post(endpoints["syllabus-approve"](syllabusId));
    return res.data;
  }

  static async unapproveSyllabus(syllabusId, reason = "") {
    if (!syllabusId) return null;
    const res = await authApis().post(
      endpoints["syllabus-unapprove"](syllabusId),
      {reason: (reason || "").trim()},
    );
    return res.data;
  }

  static async getSyllabusSignatures(syllabusId) {
    if (!syllabusId) return [];
    const res = await authApis().get(endpoints["syllabus-signatures"](syllabusId));
    return res.data;
  }

  static async checkValidationStatus(syllabusId) {
    if (!syllabusId) return { is_complete: false, missing_items: [] };
    const res = await authApis().get(endpoints["syllabus-validation-status"](syllabusId));
    return res.data;
  }

  static async signSyllabus(syllabusId, payload) {
    if (!syllabusId || !payload) return null;
    const res = await authApis().post(endpoints["syllabus-sign"](syllabusId), payload);
    return res.data;
  }
}

export default SignatureService;

