import { GOALS } from "@/lib/config/onboardingConstants";
import { FormInput } from "./FormFields";
import { GoalCard } from "./SelectionControls";
import { AddressSearch } from "./AddressSearch";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessName: string;
  industry: string;
  businessType: string;
  teamSize: string;
  goals: string[];
  address: string;
  accurateLocation: string;
  lat: number;
  long: number;
  panNo: string;
  phoneNumber: string;
}

type Updater = (key: keyof FormState) => (val: string) => void;

interface StepOneProps {
  form: FormState;
  update: Updater;
}

export const StepOne = ({ form, update }: StepOneProps) => {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
        Welcome aboard!
      </h1>
      <p className="text-slate-500 mb-8 text-sm">
        Let&lsquo;s start with the basics.
      </p>
      <div className="grid grid-cols-2 gap-x-4">
        <FormInput
          label="First name"
          value={form.firstName}
          onChange={update("firstName")}
          placeholder="Jane"
        />
        <FormInput
          label="Last name"
          value={form.lastName}
          onChange={update("lastName")}
          placeholder="Smith"
        />
      </div>
      <FormInput
        label="Name of your business"
        value={form.businessName}
        onChange={update("businessName")}
        placeholder="Meowtrix Cafe"
      />
    </div>
  );
};

interface StepTwoProps {
  form: FormState;
  update: Updater;
}

export const StepTwo = ({ form, update }: StepTwoProps) => {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
        About your business
      </h1>
      <p className="text-slate-500 mb-8 text-sm">
        Help us personalize your experience.
      </p>
      <FormInput
        label="Business name"
        value={form.businessName}
        onChange={update("businessName")}
        placeholder="Acme Co."
      />
      <FormInput
        label="Business Type"
        value={form.industry}
        onChange={update("industry")}
        placeholder="e.g. Retail, Restaurant, Service"
      />
      <FormInput
        label="Address"
        value={form.address}
        onChange={update("address")}
        placeholder="Enter your business address"
      />
      <AddressSearch
        value={form.accurateLocation}
        onChange={update("accurateLocation")}
        onCoordinates={(coords) => {
          update("lat")(String(coords.lat));
          update("long")(String(coords.lng));
        }}
      />
      <FormInput
        label="Pan No."
        value={form.panNo}
        onChange={update("panNo")}
        placeholder="Enter your PAN number"
      />
      <FormInput
        label="Phone Number"
        value={form.phoneNumber}
        onChange={update("phoneNumber")}
        placeholder="+977 98XXXXXXXX"
        type="tel"
      />
    </div>
  );
};

interface StepThreeProps {
  form: FormState;
  toggleGoal: (goal: string) => void;
}

export const StepThree = ({ form, toggleGoal }: StepThreeProps) => {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
        What brings you here?
      </h1>
      <p className="text-slate-500 mb-8 text-sm">
        Select all that apply — we&apos;ll set up your dashboard accordingly.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {GOALS.map((g) => (
          <GoalCard
            key={g.label}
            icon={g.icon}
            label={g.label}
            selected={form.goals.includes(g.label)}
            onClick={() => toggleGoal(g.label)}
          />
        ))}
      </div>
    </div>
  );
};
