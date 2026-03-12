import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";

export function DesignSystemPageFormTabsSection() {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">Form Inputs</h2>
			<Card>
				<CardContent className="pt-6 space-y-4 max-w-md">
					<div className="space-y-2">
						<Label htmlFor="email">Email address</Label>
						<Input type="email" id="email" placeholder="name@example.com" />
					</div>
					<div className="space-y-2">
						<Label>Framework</Label>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder="Select framework" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="react">React</SelectItem>
								<SelectItem value="vue">Vue</SelectItem>
								<SelectItem value="svelte">Svelte</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center space-x-2">
						<Switch id="airplane-mode" />
						<Label htmlFor="airplane-mode">Airplane Mode</Label>
					</div>
				</CardContent>
			</Card>

			<h2 className="text-xl font-semibold">Tabs</h2>
			<Tabs defaultValue="profile" className="w-[400px]">
				<TabsList>
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="password">Password</TabsTrigger>
				</TabsList>
				<TabsContent value="profile">
					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
							<CardDescription>Manage your user profile here.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="space-y-1">
								<Label htmlFor="name">Name</Label>
								<Input id="name" defaultValue="Pedro Duarte" />
							</div>
						</CardContent>
						<CardFooter>
							<Button>Save changes</Button>
						</CardFooter>
					</Card>
				</TabsContent>
				<TabsContent value="password">
					<Card>
						<CardHeader>
							<CardTitle>Password</CardTitle>
							<CardDescription>Change your password here.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="space-y-1">
								<Label htmlFor="current">Current password</Label>
								<Input id="current" type="password" />
							</div>
						</CardContent>
						<CardFooter>
							<Button>Save password</Button>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>
		</section>
	);
}
