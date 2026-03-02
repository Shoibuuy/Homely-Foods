"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { getHPConfig, setHPConfig, getMenuItems } from "@/lib/data/storage";
import type { HPConfig, HPMode, HPThresholdRule } from "@/lib/data/types";
import { HPCoin } from "@/components/hp-coin";
import { toast } from "sonner";

export default function AdminHPConfigPage() {
  const [config, setConfig] = useState<HPConfig | null>(null);
  const [menuItemCount, setMenuItemCount] = useState(0);

  useEffect(() => {
    setConfig(getHPConfig());
    setMenuItemCount(getMenuItems().length);
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  function handleModeChange(mode: HPMode) {
    setConfig((c) => (c ? { ...c, mode } : c));
  }

  function updateRule(index: number, field: keyof HPThresholdRule, value: number) {
    setConfig((c) => {
      if (!c) return c;
      const rules = [...c.thresholdRules];
      rules[index] = { ...rules[index], [field]: value };
      return { ...c, thresholdRules: rules };
    });
  }

  function addRule() {
    setConfig((c) => {
      if (!c) return c;
      const lastMin =
        c.thresholdRules.length > 0
          ? c.thresholdRules[c.thresholdRules.length - 1].minTotal + 100
          : 50;
      return {
        ...c,
        thresholdRules: [
          ...c.thresholdRules,
          { minTotal: lastMin, hpReward: 5 },
        ],
      };
    });
  }

  function removeRule(index: number) {
    setConfig((c) => {
      if (!c) return c;
      return {
        ...c,
        thresholdRules: c.thresholdRules.filter((_, i) => i !== index),
      };
    });
  }

  function handleSave() {
    if (!config) return;
    setHPConfig(config);
    toast.success("HomelyPoints configuration saved");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            HomelyPoints Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure how customers earn loyalty points
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-gold text-primary-foreground hover:bg-gold-dark"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HPCoin size="md" />
            Reward Mode
          </CardTitle>
          <CardDescription>
            Choose how customers earn HomelyPoints on their orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.mode}
            onValueChange={(v) => handleModeChange(v as HPMode)}
            className="flex flex-col gap-4"
          >
            {/* Per-Item Mode */}
            <label
              className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
                config.mode === "per-item"
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-border/80"
              }`}
            >
              <RadioGroupItem value="per-item" className="mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Per-Item Rewards (Option A)
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each menu item has its own HP reward value set by you in the
                  menu editor. Customers earn points for each item they order.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  {menuItemCount} menu items configured. Edit HP values in Menu
                  Items page.
                </div>
              </div>
            </label>

            {/* Threshold Mode */}
            <label
              className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
                config.mode === "threshold"
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-border/80"
              }`}
            >
              <RadioGroupItem value="threshold" className="mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Order Total Threshold (Option B)
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  HP earned based on order total amount. Define tiers below --
                  the highest matching tier applies.
                </p>
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Threshold Rules (only show when threshold mode) */}
      {config.mode === "threshold" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Threshold Rules</CardTitle>
            <CardDescription>
              Define minimum order totals and their HP rewards. The highest
              matching tier applies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {/* Headers */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground">
                <span>Minimum Order (AED)</span>
                <span>HP Reward</span>
                <span className="w-9" />
              </div>

              <Separator />

              {config.thresholdRules.map((rule, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-3"
                >
                  <Input
                    type="number"
                    min={0}
                    value={rule.minTotal || ""}
                    onChange={(e) =>
                      updateRule(i, "minTotal", parseFloat(e.target.value) || 0)
                    }
                    placeholder="Min total"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={rule.hpReward || ""}
                    onChange={(e) =>
                      updateRule(
                        i,
                        "hpReward",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="HP earned"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRule(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addRule}
                className="mt-1 w-fit"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Config Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-foreground">
              <span className="font-medium">Active Mode:</span>{" "}
              {config.mode === "per-item"
                ? "Per-Item Rewards"
                : "Order Total Threshold"}
            </p>
            {config.mode === "threshold" && (
              <div className="mt-3 flex flex-col gap-1.5">
                {config.thresholdRules
                  .sort((a, b) => a.minTotal - b.minTotal)
                  .map((r, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      Orders of <span className="font-medium text-foreground">AED {r.minTotal}+</span>{" "}
                      earn{" "}
                      <span className="font-medium text-gold-dark">
                        {r.hpReward} HP
                      </span>
                    </p>
                  ))}
              </div>
            )}
            {config.mode === "per-item" && (
              <p className="mt-2 text-sm text-muted-foreground">
                HP rewards are configured individually per menu item.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
