import React, { useState } from "react";
import { Steps, Button, message, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { UserAddOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from "@ant-design/icons";

import PersonalDetailsStep from "../components/DriverOfflineOnboarding/PersonalDetailsStep";
import type { PersonalDetails } from "../components/DriverOfflineOnboarding/PersonalDetailsStep";
import AddressStep from "../components/DriverOfflineOnboarding/AddressStep";
import type { AddressDetails } from "../components/DriverOfflineOnboarding/AddressStep";
import DocumentUploadStep, { DOCUMENT_CONFIGS } from "../components/DriverOfflineOnboarding/DocumentUploadStep";
import type { DocumentItem } from "../components/DriverOfflineOnboarding/DocumentUploadStep";
import ReviewStep from "../components/DriverOfflineOnboarding/ReviewStep";

import { useAppDispatch } from "../store/hooks";
import { createDriverOffline, type OfflineOnboardingPayload } from "../store/slices/driverSlice";

const DriverOfflineOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdDriverId, setCreatedDriverId] = useState<string | null>(null);

  // Form Data State
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    first_name: "",
    last_name: "",
    phone_number: "",
    alternate_contact: "",
    email: "",
    date_of_birth: "",
    gender: "",
    language: "en",
  });
  
  const [address, setAddress] = useState<AddressDetails>({
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(
    DOCUMENT_CONFIGS.map(c => ({
      document_type: c.type,
      document_number: "",
      document_url: "",
      label: c.label,
      hasFrontBack: c.hasFrontBack,
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!personalDetails.first_name) newErrors.first_name = "First name is required";
      if (!personalDetails.last_name) newErrors.last_name = "Last name is required";
      if (!personalDetails.phone_number || personalDetails.phone_number.length < 10) 
        newErrors.phone_number = "Valid phone number is required";
      if (!personalDetails.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalDetails.email))
        newErrors.email = "Valid email is required";
      if (!personalDetails.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
      if (!personalDetails.gender) newErrors.gender = "Gender is required";
    } 
    else if (step === 1) {
      if (!address.street) newErrors.street = "Street address is required";
      if (!address.city) newErrors.city = "City is required";
      if (!address.state) newErrors.state = "State is required";
      if (!address.country) newErrors.country = "Country is required";
      if (!address.pincode || address.pincode.length < 6) newErrors.pincode = "Valid pincode is required";
    }
    else if (step === 2) {
      DOCUMENT_CONFIGS.forEach(config => {
        if (config.optional) return;
        
        const doc = documents.find(d => d.document_type === config.type);
        if (!doc) {
          newErrors[config.type] = "Document is required";
          return;
        }

        if (config.hasFrontBack) {
          if (!doc.frontUrl || !doc.backUrl) {
            newErrors[config.type] = "Both front and back images are required";
          }
        } else {
          if (!doc.frontUrl && !doc.document_url) {
            newErrors[config.type] = "Image is required";
          }
        }

        // Check document number if required (assuming selfie doesn't need a number)
        if (config.type !== 'profile_selfie' && !doc.document_number) {
          newErrors[config.type] = newErrors[config.type] || "Document number is required";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      message.error("Please fix the errors before proceeding");
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) { // validate documents step
      message.error("Validation failed. Please check previous steps.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload: OfflineOnboardingPayload = {
        ...personalDetails,
        address,
        documents: documents
          .filter(d => d.frontUrl || d.document_url || (d.frontUrl && d.backUrl)) // only send uploaded docs
          .map(d => ({
            document_type: d.document_type,
            document_number: d.document_number,
            document_url: d.hasFrontBack ? { front: d.frontUrl, back: d.backUrl } : (d.frontUrl || d.document_url),
            expiry_date: d.expiry_date
          }))
      };

      const resultAction = await dispatch(createDriverOffline(payload));
      
      if (createDriverOffline.fulfilled.match(resultAction)) {
        message.success("Driver onboarded successfully!");
        setCreatedDriverId(resultAction.payload.vdrive_id || resultAction.payload.id);
        setIsSuccess(true);
      } else {
        message.error(resultAction.payload as string || "Failed to onboard driver");
      }
    } catch (error) {
      console.error(error);
      message.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0b0f19] p-6">
        <Result
          status="success"
          title="Driver Successfully Onboarded!"
          subTitle={`The driver (ID: ${createdDriverId}) is now active and can log into the driver app.`}
          extra={[
            <Button 
              type="primary" 
              key="drivers" 
              onClick={() => navigate('/drivers')}
              className="bg-blue-600"
            >
              Go to Drivers List
            </Button>,
            <Button 
              key="add_another" 
              onClick={() => {
                setIsSuccess(false);
                setCurrentStep(0);
                // Reset states...
                window.location.reload(); // Simple way to reset all state for now
              }}
            >
              Onboard Another Driver
            </Button>,
          ]}
          className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-2xl w-full"
        />
      </div>
    );
  }

  const steps = [
    { title: "Personal Details", content: <PersonalDetailsStep data={personalDetails} onChange={(d) => setPersonalDetails({...personalDetails, ...d})} errors={errors} /> },
    { title: "Address", content: <AddressStep data={address} onChange={(d) => setAddress({...address, ...d})} errors={errors} /> },
    { title: "Documents", content: <DocumentUploadStep documents={documents} onChange={setDocuments} errors={errors} /> },
    { title: "Review", content: <ReviewStep personalDetails={personalDetails} address={address} documents={documents} onEditStep={setCurrentStep} /> },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-16 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          />
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserAddOutlined className="text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 leading-tight">Offline Onboarding</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Register a new driver manually</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Stepper */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <Steps 
              current={currentStep} 
              onChange={(step) => {
                // Allow going back without validation, but require validation to go forward
                if (step < currentStep) {
                  setCurrentStep(step);
                } else if (step === currentStep + 1) {
                  nextStep();
                }
              }}
              className="custom-stepper"
              items={steps.map(item => ({ key: item.title, title: item.title }))}
            />
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px]">
            {steps[currentStep].content}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 sticky bottom-6 z-20">
            <Button 
              onClick={prevStep} 
              disabled={currentStep === 0 || isSubmitting}
              icon={<ArrowLeftOutlined />}
              size="large"
              className="rounded-lg"
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button 
                type="primary" 
                onClick={nextStep}
                icon={<ArrowRightOutlined />}
                size="large"
                className="bg-blue-600 rounded-lg shadow-md shadow-blue-500/20"
              >
                Continue
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={<CheckOutlined />}
                size="large"
                className="bg-emerald-600 hover:!bg-emerald-500 border-emerald-600 rounded-lg shadow-md shadow-emerald-500/20"
              >
                Submit & Register Driver
              </Button>
            )}
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-stepper .ant-steps-item-title {
          font-size: 13px !important;
          font-weight: 600 !important;
        }
        .dark .custom-stepper .ant-steps-item-title {
          color: #94a3b8 !important;
        }
        .dark .custom-stepper .ant-steps-item-active .ant-steps-item-title {
          color: #f1f5f9 !important;
        }
        .dark .custom-stepper .ant-steps-item-wait .ant-steps-item-title {
          color: #475569 !important;
        }
      `}</style>
    </div>
  );
};

export default DriverOfflineOnboarding;
