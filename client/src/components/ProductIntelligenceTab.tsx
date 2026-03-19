import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, CheckCircle2, DollarSign, TrendingUp,
  ChevronDown, ChevronRight, ShieldCheck, Paintbrush, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductRecommendation, ProductIntelligenceEntry } from "../../../shared/productIntelligence";

const categoryIcons: Record<string, React.ReactNode> = {
  Protection: <ShieldCheck className="w-4 h-4" />,
  Appearance: <Paintbrush className="w-4 h-4" />,
  Security: <Lock className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  Protection: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Appearance: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Security: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function ProductIntelligenceTab({ sessionId, hasTranscript }: { sessionId: number; hasTranscript: boolean }) {
  const { data, isLoading } = trpc.productIntelligence.recommend.useQuery(
    { sessionId },
    { enabled: hasTranscript },
  );
  const { data: catalog } = trpc.productIntelligence.catalog.useQuery();

  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  if (!hasTranscript) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
          <p className="text-muted-foreground">No transcript available. Record or upload a session to get product recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations: ProductRecommendation[] = data?.recommendations ?? [];
  const missedRevenue: number = data?.missedRevenue ?? 0;
  const missedCount = recommendations.filter((r: ProductRecommendation) => r.status === "missed").length;
  const improveCount = recommendations.filter((r: ProductRecommendation) => r.status === "improve").length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{missedCount}</p>
              <p className="text-xs text-muted-foreground">Products Missed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{improveCount}</p>
              <p className="text-xs text-muted-foreground">Need Improvement</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">${missedRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Potential Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Product Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec: ProductRecommendation) => {
              const isExpanded = expandedProduct === rec.productType;
              const catalogItem = (catalog as ProductIntelligenceEntry[] | undefined)?.find((c: ProductIntelligenceEntry) => c.productType === rec.productType);
              return (
                <div
                  key={rec.productType}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedProduct(isExpanded ? null : rec.productType)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-muted-foreground text-sm font-mono w-6">#{rec.priority}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{rec.displayName}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", categoryColors[rec.category])}
                        >
                          {categoryIcons[rec.category]}
                          <span className="ml-1">{rec.category}</span>
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            rec.status === "missed"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          )}
                        >
                          {rec.status === "missed" ? "Missed" : "Improve"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{rec.reason}</p>
                    </div>
                    <span className="text-sm font-medium text-green-400">${rec.potentialProfit}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">ASURA Talk Track</p>
                        <p className="text-sm italic text-primary">&ldquo;{rec.suggestedTalkTrack}&rdquo;</p>
                      </div>
                      {catalogItem && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Cost Range</p>
                              <p className="text-sm">${catalogItem.costRange.min} – ${catalogItem.costRange.max}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Avg Close Rate</p>
                              <p className="text-sm">{Math.round(catalogItem.avgCloseRate * 100)}%</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Common Objections</p>
                            <ul className="text-sm space-y-1">
                              {catalogItem.commonObjections.map((obj: string, i: number) => (
                                <li key={i} className="text-muted-foreground">• {obj}</li>
                              ))}
                            </ul>
                          </div>
                          {catalogItem.stateRestrictions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">State Restrictions</p>
                              <ul className="text-sm space-y-1">
                                {catalogItem.stateRestrictions.map((sr: { state: string; restriction: string }, i: number) => (
                                  <li key={i} className="text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px] mr-1">{sr.state}</Badge>
                                    {sr.restriction}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All products well-presented!</p>
            <p className="text-sm text-muted-foreground mt-1">This session covered all F&I products effectively.</p>
          </CardContent>
        </Card>
      )}

      {/* Full Catalog Toggle */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowCatalog(!showCatalog)}
      >
        {showCatalog ? "Hide" : "Show"} Full Product Catalog ({catalog?.length ?? 0} products)
      </Button>

      {showCatalog && catalog && (
        <div className="grid gap-3">
          {(catalog as ProductIntelligenceEntry[]).map((product: ProductIntelligenceEntry) => (
            <Card key={product.productType} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{product.displayName}</span>
                  <Badge variant="outline" className={cn("text-[10px]", categoryColors[product.category])}>
                    {product.category}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold">Cost:</span> ${product.costRange.min}–${product.costRange.max}
                  </div>
                  <div>
                    <span className="font-semibold">Dealer Cost:</span> ${product.dealerCost}
                  </div>
                  <div>
                    <span className="font-semibold">Close Rate:</span> {Math.round(product.avgCloseRate * 100)}%
                  </div>
                  <div>
                    <span className="font-semibold">Avg Profit:</span> ${product.avgProfit}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
