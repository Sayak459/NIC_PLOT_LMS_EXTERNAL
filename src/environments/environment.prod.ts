export const environment = {
  production: true,
  useLocalHeaders: false,

  //command for production
  //ng build --configuration production



  baseUrl: 'https://kdseodb.smportkolkata.in/ccuPomsKdsLmsApi/api/v1/PomsLmsApi/', //live server
  vidUrl: 'https://kdseodb.smportkolkata.in/ccuPomsKdsVidApi/api/v1/PomsVidApi/', //live server

   //baseUrl: 'http://192.168.66.75:8080/ccuPomsKdsLmsApi/api/v1/PomsLmsApi/', //locally live deployment
  //vidUrl: 'http://192.168.66.75:8080/ccuPomsKdsVidApi/api/v1/PomsVidApi/', //locally video deployment

  videoApi: 'getVideo',

  getAppliedApplications: 'getAppliedApplications',
  getActiveInactiveApplications: 'getActiveInactiveApplications',

  // Applied Update
  getCargoDetailsByApplication: 'getCargoDetailsByApplication',
  updateOneLandLicence: 'updateOneLandLicence',
  updateElevenMonthsLicense: 'updateElevenMonthsLicense',

  //Application Form Api One Month New
  getVoyageAndCargoDetails: 'getVoyageAndCargoDetails',
  getShedYard: 'getShedYard',
  setOneLandLicence: 'setOneLandLicence',

  //Application Form Api Eleven Month New
  setElevenLandLicence: 'setElevenLandLicence',
  getCargoMidTerm: 'getCargoMidTerm',

  // 🟦 Measurement APIs
  getPendingMeasurements: 'getPendingMeasurements',
  //saving
  setMeasurementDetails: 'setMeasurementDetails',

  //Remeasurement APIs
  getPendingRemeasurements: 'getPendingRemeasurements',
  //saving
  setRemeasurementDetails: 'setRemeasurementDetails',

  //Handover APIs
  getPendingNormalHandover: 'getPendingNormalHandover',
  setNormalHandoverDetails: 'setNormalHandoverDetails',

  getPending1MPartialHandover: 'getPending1MPartialHandover',
  setPartialHandoverDetails: 'setPartialHandoverDetails',

  getPending1MFullHandover: 'getPending1MFullHandover',
  setFullHandoverDetails: 'setFullHandoverDetails',

  //PARTY DETAILS
  getPartyPdaDetails: 'getPartyPdaDetails',

  //Map Details..
  getOccupancyDetails: 'getOccupancyDetails',

  //Report details
  getOpearationReport: 'getOpearationReport',
  generateReport: 'reports',
  //LMS.OPR.R.01.1

  //internal

  //verification APIs
  getPendingVerification: 'getPendingVerification',
  getCargoDetails: 'getCargoDetails',
  showDoc: 'showDoc',
  setVerifyApplication: 'setVerifyApplication',

  //approval APIs
  getPendingApproval: 'getPendingApproval',
  getBlockDetails: 'getBlockDetails',
  setApproveApplication: 'setApproveApplication',
  setDenyApproveApplication: 'setDenyApproveApplication',

  //allotments APIs
  getPendingAllotment: 'getPendingAllotment',
  getApprovedBlocks: 'getApprovedBlocks',
  getBillDetails1M: 'getBillDetails1M',
  getBillDetails11M: 'getBillDetails11M',
  getPdaBalance: 'getPdaBalance',
  setAllotAndGenerateBill1M: 'setAllotAndGenerateBill1M',
  setAllotAndGenerateBill11M: 'setAllotAndGenerateBill11M',

  //measurement apis
  getPendingMeasurementDetails: 'getPendingMeasurementDetails',
  getAllotedBlocks: 'getAllotedBlocks',
  setMeasurement: 'setMeasurement',
  resubmitMeasurement: 'resubmitMeasurement',

  //remeasurement apis
  getPendingRemeasurementDetails: 'getPendingRemeasurementDetails',
  setRemeasurement: 'setRemeasurement',

  //remeasurement approval APIs
  getPendingDeputyApprovalRemeasurementApplication:
    'getPendingDeputyApprovalRemeasurementApplication',
  setPendingDeputyApprovalRemeasurementApplication:
    'setPendingDeputyApprovalRemeasurementApplication',
  setResubmitDeputyApprovalApplication: 'setResubmitDeputyApprovalApplication',

  //bill APIs
  getApplicationsForAutoBillGenerate: 'getApplicationsForAutoBillGenerate',
  getAutoBillDetails: 'getAutoBillDetails',
  insertAutoBillDetails: 'insertAutoBillDetails',

  //handover APIs
  getHandoverDetails: 'getHandoverDetails',
  getPartialHandoverDetails: 'getPartialHandoverDetails',
  getFullHandoverDetails: 'getFullHandoverDetails',
  verifyPartialHandover: 'verifyPartialHandover',
  verifyFullHandover: 'verifyFullHandover',
  verifyNormalHandover: 'verifyNormalHandover',
  declineHandoverApplication: 'declineHandoverApplication',
  resubmitFullHandover: 'resubmitFullHandover',

  //approval for handover
  getApprovalOfFHandoverDetails: 'getApprovalOfFHandoverDetails',
  getApprovalOfPHandoverDetails: 'getApprovalOfPHandoverDetails',
  approvalPartialHandover: 'approvalPartialHandover',
  approveFullHandover: 'approveFullHandover',
  resubmitapproveFullHandover: 'resubmitapproveFullHandover',

  //refund for handover
  getApprovalOfPartialRefund: 'getApprovalOfPartialRefund',
  getApprovalOfFullRefund: 'getApprovalOfFullRefund',
  getEstimatedBillSecurityPartial: 'getEstimatedBillSecurityPartial',
  getEstimatedBillSecurityFull: 'getEstimatedBillSecurityFull',
  setPartialHandoverRefund: 'setPartialHandoverRefund',
  setFullHandoverRefund: 'setFullHandoverRefund',

  //flag release
  getApplicationForFlagRelease: 'getApplicationForFlagRelease',
  setFlagRelease: 'setFlagRelease',

  //approval for security release
  getApprovalOfSecurityReleaseDetails: 'getApprovalOfSecurityReleaseDetails',
  setApprovalOfSecurityRelease: 'setApprovalOfSecurityRelease',
  setApprovalForfietOfSecurityRelease: 'setApprovalForfietOfSecurityRelease',

  //secretary release application details
  getSecurityReleaseApplicationDetails: 'getSecurityReleaseApplicationDetails',
  setreleaseSecurity: 'setreleaseSecurity',

  //dy approval
  getDyApprovalOfApplications: 'getDyApprovalOfApplications',
  setDyApprovalOfApplications: 'setDyApprovalOfApplications',

  // partyCd: 'TPRC1001' // Example party code for testing
};
