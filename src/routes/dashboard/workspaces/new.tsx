import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace, type CreateWorkspaceRequest } from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and dashes"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/dashboard/workspaces/new")({
  component: NewWorkspacePage,
});

function NewWorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      // Create a complete request object. 
      // Most fields are optional in the schema but Typescript might want a partial match or full match depending on generated types.
      // Based on openapi.gen.ts we saw, fields are optional in the request body definition if they weren't marked required in OpenAPI.
      // However, the generated type `CreateWorkspaceRequest` might have them as required if not specified otherwise.
      // We'll cast to any or construct a minimal valid object.
      // Looking at the openapi definition again, `requestBody` has `allowCustomEveServers` etc.
      // We will assume defaults for now.
      
      const payload: any = {
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        isPublic: false,
        // Provide reasonable defaults for required fields if they exist
        allowCustomEveServers: false,
        allowCustomNetlabServers: false,
        allowExternalTemplateRepos: false,
        awsAccountId: "",
        awsAuthMethod: "",
        awsRegion: "",
        awsRoleName: "",
        blueprint: "",
        eveServer: "",
        externalTemplateRepos: [],
        netlabServer: "",
        sharedUsers: [],
      };
      
      return createWorkspace(payload as CreateWorkspaceRequest);
    },
    onSuccess: async (data) => {
      toast.success("Workspace created", {
        description: `Workspace "${data.name}" has been created successfully.`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
      await navigate({ to: "/dashboard/deployments", search: { workspace: data.id } });
    },
    onError: (error) => {
      toast.error("Failed to create workspace", {
        description: error.message,
      });
    },
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate(values);
  }

  // Auto-generate slug from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    form.setValue("name", name);
    if (!form.getFieldState("slug").isDirty) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Create Workspace</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>
            Workspaces organize your deployments and resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My Project" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      A display name for your workspace.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="my-project" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unique identifier used in URLs. Only lowercase letters, numbers, and dashes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the purpose of this workspace..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional description for your team.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate({ to: "/dashboard/deployments" })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Workspace"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
