import { Search } from "lucide-react";


export function EmptyData() {
	
	const quickSearches = [
		"Women CEOs in San Diego who like wellness",
		"James New York",
		"Oil & gas founders",
		"Who did I meet at GLC Singapore?",
		"Tech leaders in AI",
	];
	
	return (
		<div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 bg-primary/5 rounded-full">
                <Search className="h-12 w-12 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Magical Member Search</h3>

                <p className="text-muted-foreground max-w-md text-pretty">
                  Search by name, location, industry, interests, or ask natural questions. Our AI
                  understands what you're looking for.
                </p>
              </div>

              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm font-medium text-muted-foreground">Try these searches:</p>

              </div>
            </div>
	);
}
