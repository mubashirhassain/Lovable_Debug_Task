import { useReducer, useState } from "react";
import { Mail, User, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateLeadForm } from "@/lib/validation";
import { useLeadStore } from "@/lib/lead-store";

// State machine types
type FormState = {
  status: "idle" | "validating" | "submitting" | "success" | "error";
  values: {
    name: string;
    email: string;
    industry: string;
  };
  errors: {
    name?: string;
    email?: string;
    industry?: string;
  };
};

type FormAction =
  | { type: "CHANGE_FIELD"; field: keyof FormState["values"]; value: string }
  | { type: "VALIDATE" }
  | { type: "SUBMIT" }
  | { type: "SUCCESS" }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

// Design system components
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-md mx-auto">
    <div className="bg-gradient-card p-8 rounded-2xl shadow-card border border-border backdrop-blur-sm animate-slide-up">
      {children}
    </div>
  </div>
);

const IconCircle = ({
  icon: Icon,
  size = "md",
}: {
  icon: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  return (
    <div
      className={`${sizes[size]} bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow`}
    >
      <Icon
        className={`${
          size === "lg" ? "w-10 h-10" : "w-8 h-8"
        } text-primary-foreground`}
      />
    </div>
  );
};

const FormTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
    {children}
  </h2>
);

const FormDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground text-center mb-8">{children}</p>
);

const FormGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6">{children}</div>
);

// Form reducer
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "CHANGE_FIELD":
      return {
        ...state,
        values: {
          ...state.values,
          [action.field]: action.value,
        },
        errors: {
          ...state.errors,
          [action.field]: undefined,
        },
      };
    case "VALIDATE":
      const validationErrors = validateLeadForm(state.values);
      const errorMap = validationErrors.reduce((acc, err) => {
        acc[err.field as keyof FormState["errors"]] = err.message;
        return acc;
      }, {} as FormState["errors"]);

      return {
        ...state,
        errors: errorMap,
        status: Object.keys(errorMap).length > 0 ? "error" : "validating",
      };
    case "SUBMIT":
      return { ...state, status: "submitting" };
    case "SUCCESS":
      return { ...state, status: "success" };
    case "ERROR":
      return { ...state, status: "error" };
    case "RESET":
      return {
        status: "idle",
        values: { name: "", email: "", industry: "" },
        errors: {},
      };
    default:
      return state;
  }
};

// Custom hook for form handling
const useLeadForm = () => {
  const [state, dispatch] = useReducer(formReducer, {
    status: "idle",
    values: { name: "", email: "", industry: "" },
    errors: {},
  });

  const handleChange = (field: keyof FormState["values"], value: string) => {
    dispatch({ type: "CHANGE_FIELD", field, value });
  };

  const validate = () => {
    dispatch({ type: "VALIDATE" });
    return Object.keys(state.errors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return false;

    dispatch({ type: "SUBMIT" });
    try {
      const response = await fetch(
        "https://ytyopyznqpnylebzibby.supabase.co/functions/v1/clever-task",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eW9weXpucXBueWxlYnppYmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI3NTUsImV4cCI6MjA3MDEyODc1NX0.nr9WV_ybqZ6PpWT6GjAQm0Bsdr-Q5IejEhToV34VY4E",
          },
          body: JSON.stringify(state.values),
        }
      );

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      dispatch({ type: "SUCCESS" });
      return true;
    } catch (error) {
      dispatch({
        type: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };

  return { state, handleChange, submit, reset };
};

// Form components
const TextField = ({
  field,
  icon: Icon,
  placeholder,
  type = "text",
}: {
  field: keyof FormState["values"];
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  type?: string;
}) => {
  const { state, handleChange } = useLeadForm();

  return (
    <div className="space-y-2">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type={type}
          placeholder={placeholder}
          value={state.values[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className={`pl-10 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground transition-smooth ${
            state.errors[field]
              ? "border-destructive"
              : "focus:border-accent focus:shadow-glow"
          }`}
        />
      </div>
      {state.errors[field] && (
        <p className="text-destructive text-sm animate-fade-in">
          {state.errors[field]}
        </p>
      )}
    </div>
  );
};

const IndustryField = () => {
  const { state, handleChange } = useLeadForm();
  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail & E-commerce",
    "Manufacturing",
    "Consulting",
    "Other",
  ];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
        <Select
          value={state.values.industry}
          onValueChange={(value) => handleChange("industry", value)}
        >
          <SelectTrigger
            className={`pl-10 h-12 bg-input border-border text-foreground transition-smooth ${
              state.errors.industry
                ? "border-destructive"
                : "focus:border-accent focus:shadow-glow"
            }`}
          >
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem
                key={industry
                  .toLowerCase()
                  .replace(/ & /g, "-")
                  .replace(/\s+/g, "-")}
                value={industry
                  .toLowerCase()
                  .replace(/ & /g, "-")
                  .replace(/\s+/g, "-")}
              >
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state.errors.industry && (
        <p className="text-destructive text-sm animate-fade-in">
          {state.errors.industry}
        </p>
      )}
    </div>
  );
};

const SubmitButton = () => {
  const { state, submit } = useLeadForm();

  return (
    <Button
      type="button"
      onClick={submit}
      disabled={state.status === "submitting"}
      className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-lg shadow-glow hover:shadow-[0_0_60px_hsl(210_100%_60%/0.3)] transition-smooth transform hover:scale-[1.02]"
    >
      {state.status === "submitting" ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        <>
          <CheckCircle className="w-5 h-5 mr-2" />
          Get Early Access
        </>
      )}
    </Button>
  );
};

const SuccessView = ({
  leadCount,
  onReset,
}: {
  leadCount: number;
  onReset: () => void;
}) => (
  <Card>
    <div className="text-center">
      <IconCircle icon={CheckCircle} size="lg" />
      <FormTitle>Welcome aboard! 🎉</FormTitle>
      <FormDescription>
        Thanks for joining! We'll be in touch soon with updates.
      </FormDescription>
      <p className="text-sm text-accent mb-8">
        You're #{leadCount} in this session
      </p>

      <FormGroup>
        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
          <p className="text-sm text-foreground">
            💡 <strong>What's next?</strong>
            <br />
            We'll send you exclusive updates, early access, and
            behind-the-scenes content.
          </p>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full border-border hover:bg-accent/10 transition-smooth group"
        >
          Submit Another Lead
          <User className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </FormGroup>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Follow our journey on social media for real-time updates
        </p>
      </div>
    </div>
  </Card>
);

export const LeadCaptureForm = () => {
  const { state, reset } = useLeadForm();
  const { leads, addLead } = useLeadStore();

  const handleSubmitSuccess = async () => {
    await addLead({
      ...state.values,
      submitted_at: new Date().toISOString(),
    });
  };

  if (state.status === "success") {
    handleSubmitSuccess();
    return <SuccessView leadCount={leads.length} onReset={reset} />;
  }

  return (
    <Card>
      <div className="text-center mb-8">
        <IconCircle icon={Mail} />
        <FormTitle>Join Our Community</FormTitle>
        <FormDescription>Be the first to know when we launch</FormDescription>
      </div>

      <FormGroup>
        <TextField field="name" icon={User} placeholder="Your name" />
        <TextField
          field="email"
          icon={Mail}
          placeholder="your@email.com"
          type="email"
        />
        <IndustryField />
        <SubmitButton />
      </FormGroup>

      <p className="text-xs text-muted-foreground text-center mt-6">
        By submitting, you agree to receive updates. Unsubscribe anytime.
      </p>
    </Card>
  );
};
