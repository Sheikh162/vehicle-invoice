
// src/components/ui/layout/Sidebar.tsx
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
  } from "@/components/ui/navigation-menu";
import Link from "next/link";
  
interface SidebarProps {
    navItems: {
        name: string;
        href: string;
    }[];
}

export function Sidebar({ navItems }: SidebarProps) {
    return (
        <aside className="w-64 p-4 border-r">
            <NavigationMenu>
                <NavigationMenuList className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                        <NavigationMenuItem key={item.name}>
                            <NavigationMenuLink href={item.href} className={navigationMenuTriggerStyle()}>
                                {item.name}
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        </aside>
    )
}