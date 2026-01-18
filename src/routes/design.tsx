import { createFileRoute } from "@tanstack/react-router";
import { 
  Activity, 
  AlertCircle, 
  Bell, 
  Check, 
  ChevronRight, 
  Cloud, 
  CreditCard, 
  Inbox, 
  Mail, 
  Settings, 
  User 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { BentoGrid, BentoItem, BentoStatCard } from "../components/ui/bento-grid";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../components/ui/breadcrumb";
import { toast } from "sonner";

export const Route = createFileRoute("/design")({
  component: DesignSystemPage
});

function DesignSystemPage() {
  return (
    <div className="space-y-10 p-6 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">
          A catalog of all reusable UI components available in the portal.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Settings className="h-4 w-4" /></Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" /> With Icon
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Standard container style</CardDescription>
            </CardHeader>
            <CardContent>Content goes here</CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Backdrop blur effect</CardDescription>
            </CardHeader>
            <CardContent>Popular for headers</CardContent>
          </Card>
          <Card variant="flat">
            <CardHeader>
              <CardTitle>Flat Card</CardTitle>
              <CardDescription>No shadow, border only</CardDescription>
            </CardHeader>
            <CardContent>Clean look</CardContent>
          </Card>
          <Card variant="danger">
            <CardHeader>
              <CardTitle>Danger Card</CardTitle>
              <CardDescription>For error states</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">Something went wrong</CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Bento Grid</h2>
        <BentoGrid>
          <BentoStatCard
            title="Total Revenue"
            value="$45,231.89"
            icon={<CreditCard className="h-4 w-4" />}
            gradient="blue"
          />
          <BentoStatCard
            title="Active Users"
            value="+2350"
            icon={<User className="h-4 w-4" />}
            gradient="green"
          />
          <BentoItem gradient="purple" className="md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-background/20 rounded-full">
                <Cloud className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Cloud Infrastructure</h3>
                <p className="text-sm text-muted-foreground/80">
                  Manage your cloud resources and deployments from a single dashboard.
                </p>
              </div>
            </div>
          </BentoItem>
        </BentoGrid>
      </section>

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
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Make changes to your account here.</CardDescription>
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

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Feedback & Status</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Empty State</h3>
            <div className="border rounded-lg p-4">
              <EmptyState
                icon={Inbox}
                title="No items found"
                description="You haven't created any items yet."
                action={{ label: "Create Item", onClick: () => toast("Clicked create") }}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Skeleton Loading</h3>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-[140px] mb-2" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Toast Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => toast("Event has been created")}>
            Simple Toast
          </Button>
          <Button variant="outline" onClick={() => toast.success("Event created successfully")}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.error("Failed to create event")}>
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.info("New updates available", { description: "Refresh to see changes" })}>
            With Description
          </Button>
          <Button variant="outline" onClick={() => toast("Event deleted", { action: { label: "Undo", onClick: () => console.log("Undo") } })}>
            With Action
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Breadcrumbs</h2>
        <div className="p-4 border rounded-lg">
          <Breadcrumb>
                          <BreadcrumbList>
                            <BreadcrumbItem>
                              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>
    </div>
  );
}
