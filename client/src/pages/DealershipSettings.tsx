import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Settings, Save, Shield, Clock, FileText } from "lucide-react";

export default function DealershipSettings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save settings");
    },
  });

  const [maxSessionDuration, setMaxSessionDuration] = useState(120);
  const [autoGradeEnabled, setAutoGradeEnabled] = useState(true);
  const [requireCustomerName, setRequireCustomerName] = useState(true);
  const [requireDealNumber, setRequireDealNumber] = useState(false);
  const [consentMethod, setConsentMethod] = useState<"verbal" | "written" | "electronic">("verbal");

  useEffect(() => {
    if (settings) {
      setMaxSessionDuration(settings.maxSessionDuration ?? 120);
      setAutoGradeEnabled(settings.autoGradeEnabled ?? true);
      setRequireCustomerName(settings.requireCustomerName ?? true);
      setRequireDealNumber(settings.requireDealNumber ?? false);
      setConsentMethod((settings.consentMethod as "verbal" | "written" | "electronic") ?? "verbal");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      maxSessionDuration,
      autoGradeEnabled,
      requireCustomerName,
      requireDealNumber,
      consentMethod,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Dealership Settings</h1>
          <p className="text-sm text-muted-foreground">Configure session behavior and compliance requirements for your rooftop</p>
        </div>
      </div>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Session Configuration
          </CardTitle>
          <CardDescription>Control how sessions are recorded and graded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="maxDuration">Max Session Duration (minutes)</Label>
            <Input
              id="maxDuration"
              type="number"
              min={15}
              max={480}
              value={maxSessionDuration}
              onChange={(e) => setMaxSessionDuration(Number(e.target.value))}
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">Sessions exceeding this limit will be automatically ended (15–480 min)</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Grade Sessions</Label>
              <p className="text-xs text-muted-foreground">Automatically generate performance grades when a session ends</p>
            </div>
            <Switch
              checked={autoGradeEnabled}
              onCheckedChange={setAutoGradeEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Required Fields
          </CardTitle>
          <CardDescription>Fields that must be filled before a session can start</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Customer Name</Label>
              <p className="text-xs text-muted-foreground">Managers must enter the customer's name before starting</p>
            </div>
            <Switch
              checked={requireCustomerName}
              onCheckedChange={setRequireCustomerName}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Deal Number</Label>
              <p className="text-xs text-muted-foreground">Managers must enter a deal/stock number before starting</p>
            </div>
            <Switch
              checked={requireDealNumber}
              onCheckedChange={setRequireDealNumber}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            CFPB Compliance
          </CardTitle>
          <CardDescription>Default consent method for recording disclosure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Default Consent Method</Label>
            <Select value={consentMethod} onValueChange={(v) => setConsentMethod(v as typeof consentMethod)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbal">Verbal — spoken acknowledgment</SelectItem>
                <SelectItem value="written">Written — signed document</SelectItem>
                <SelectItem value="electronic">Electronic — digital signature</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This pre-selects the consent method in the LiveSession form. Managers can override per session.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
