import axios from 'axios';
import { UbuntuInstance } from '../schema';

// Digital Ocean API client for VM management
export class DigitalOceanClient {
  private apiKey: string;
  private baseUrl = 'https://api.digitalocean.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Create a new droplet (VM)
  async createDroplet(name: string, region = 'nyc1', size = 's-2vcpu-2gb', image = 'ubuntu-22-04-x64'): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/droplets`,
        {
          name,
          region,
          size,
          image,
          ssh_keys: [], // Add your SSH keys here if needed
          backups: false,
          ipv6: false,
          monitoring: true,
          tags: ['vibepr', 'testing'],
          user_data: this.getUserDataScript(),
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.droplet;
    } catch (error) {
      console.error('Error creating droplet:', error);
      throw error;
    }
  }

  // Get droplet details
  async getDroplet(dropletId: number): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/droplets/${dropletId}`,
        { headers: this.getHeaders() }
      );
      
      return response.data.droplet;
    } catch (error) {
      console.error(`Error getting droplet ${dropletId}:`, error);
      throw error;
    }
  }

  // Delete a droplet
  async deleteDroplet(dropletId: number): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/droplets/${dropletId}`,
        { headers: this.getHeaders() }
      );
      
      return true;
    } catch (error) {
      console.error(`Error deleting droplet ${dropletId}:`, error);
      throw error;
    }
  }

  // Get the IP address of a droplet
  async getDropletIp(dropletId: number): Promise<string | null> {
    try {
      const droplet = await this.getDroplet(dropletId);
      const ipv4Networks = droplet.networks.v4 || [];
      const publicNetwork = ipv4Networks.find((network: any) => network.type === 'public');
      
      return publicNetwork ? publicNetwork.ip_address : null;
    } catch (error) {
      console.error(`Error getting IP for droplet ${dropletId}:`, error);
      throw error;
    }
  }

  // Wait for a droplet to be ready (active status)
  async waitForDropletActive(dropletId: number, maxAttempts = 20, interval = 5000): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const droplet = await this.getDroplet(dropletId);
      
      if (droplet.status === 'active') {
        return droplet;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Droplet ${dropletId} did not become active within the timeout period`);
  }

  // Create a cloud-init script for initial VM setup
  private getUserDataScript(): string {
    return `#!/bin/bash
# Update and install necessary packages
apt-get update
apt-get install -y curl wget git build-essential nodejs npm xvfb chromium-browser

# Setup user for testing
useradd -m -s /bin/bash vibepr
echo "vibepr ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vibepr

# Setup SSH for remote access
mkdir -p /home/vibepr/.ssh
chmod 700 /home/vibepr/.ssh
# Add your SSH public key here if needed
# echo "ssh-rsa YOUR_PUBLIC_KEY" > /home/vibepr/.ssh/authorized_keys
chmod 600 /home/vibepr/.ssh/authorized_keys
chown -R vibepr:vibepr /home/vibepr/.ssh

# Install noVNC for browser access
git clone https://github.com/novnc/noVNC.git /opt/novnc
git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify

# Setup Xvfb and desktop environment
apt-get install -y xfce4 xfce4-goodies
cat > /etc/systemd/system/xvfb.service << EOF
[Unit]
Description=X Virtual Frame Buffer Service
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :1 -screen 0 1920x1080x24
User=vibepr

[Install]
WantedBy=multi-user.target
EOF

# Setup noVNC service
cat > /etc/systemd/system/novnc.service << EOF
[Unit]
Description=noVNC Service
After=xvfb.service

[Service]
Environment=DISPLAY=:1
ExecStart=/opt/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080
User=vibepr

[Install]
WantedBy=multi-user.target
EOF

# Setup VNC server
apt-get install -y x11vnc
cat > /etc/systemd/system/x11vnc.service << EOF
[Unit]
Description=X11 VNC Server
After=xvfb.service

[Service]
Environment=DISPLAY=:1
ExecStart=/usr/bin/x11vnc -forever -shared -display :1
User=vibepr

[Install]
WantedBy=multi-user.target
EOF

# Start services
systemctl daemon-reload
systemctl enable xvfb.service
systemctl enable x11vnc.service
systemctl enable novnc.service
systemctl start xvfb.service
systemctl start x11vnc.service
systemctl start novnc.service

# Setup startup script for XFCE
cat > /home/vibepr/.xinitrc << EOF
#!/bin/sh
exec startxfce4
EOF
chmod +x /home/vibepr/.xinitrc
chown vibepr:vibepr /home/vibepr/.xinitrc

echo "Setup complete!"
`;
  }

  // Start an Ubuntu instance for testing
  async startUbuntu(): Promise<UbuntuInstance> {
    try {
      // Create a unique name for the droplet
      const name = `vibepr-test-${Date.now()}`;
      
      // Create the droplet
      const droplet = await this.createDroplet(name);
      const dropletId = droplet.id;
      
      // Wait for the droplet to be active
      await this.waitForDropletActive(dropletId);
      
      // Get the IP address
      const ip = await this.getDropletIp(dropletId);
      
      if (!ip) {
        throw new Error('Could not get IP address for droplet');
      }
      
      // Create an instance wrapper
      const instance: UbuntuInstance = {
        id: dropletId.toString(),
        get_stream_url: () => ({ stream_url: `http://${ip}:6080/vnc.html` }),
        bash: async (command: string) => {
          // In a real implementation, this would SSH into the VM and run the command
          console.log(`Would run command on ${ip}: ${command}`);
          // Mock implementation
          return { stdout: 'Command executed', stderr: '' };
        },
        env: {
          set: (variables: Record<string, string>) => {
            // In a real implementation, this would set environment variables in the VM
            console.log(`Would set variables on ${ip}:`, variables);
          },
        },
        file: {
          write: (path: string, content: string) => {
            // In a real implementation, this would write a file to the VM
            console.log(`Would write file to ${ip}:${path}`);
          },
        },
        stop: async () => {
          // Delete the droplet when done
          try {
            await this.deleteDroplet(dropletId);
            console.log(`Deleted droplet ${dropletId}`);
          } catch (error) {
            console.error(`Failed to delete droplet ${dropletId}:`, error);
          }
        },
      };
      
      return instance;
    } catch (error) {
      console.error('Error starting Ubuntu instance:', error);
      throw error;
    }
  }
}

// Create a ScrapybaraClient compatible with our interface
export class DigitalOceanScrapybaraClient {
  private doClient: DigitalOceanClient;
  
  constructor(apiKey: string) {
    this.doClient = new DigitalOceanClient(apiKey);
  }
  
  // Start an Ubuntu instance
  start_ubuntu(): UbuntuInstance {
    // This is a synchronous method in our interface, but DO API is async
    // In a real implementation, you might want to make this properly async
    // For now, we'll return a placeholder and update it later
    const placeholder: UbuntuInstance = {
      id: `pending-${Date.now()}`,
      get_stream_url: () => ({ stream_url: 'pending' }),
      bash: async () => ({ stdout: '', stderr: '' }),
      env: { set: () => {} },
      file: { write: () => {} },
      stop: async () => {},
    };
    
    // Start the actual instance in the background
    this.doClient.startUbuntu()
      .then(instance => {
        // Update the placeholder with the real instance
        placeholder.id = instance.id;
        placeholder.get_stream_url = instance.get_stream_url;
        placeholder.bash = instance.bash;
        placeholder.env = instance.env;
        placeholder.file = instance.file;
        placeholder.stop = instance.stop;
      })
      .catch(error => {
        console.error('Failed to start Ubuntu instance:', error);
      });
    
    return placeholder;
  }
  
  // Execute actions on the instance
  async act(options: {
    model: any;
    tools: any[];
    system: string;
    prompt: string;
    schema?: any;
    on_step?: (step: any) => void;
  }): Promise<{ output: any }> {
    // This would integrate with Anthropic Claude or similar
    // For now, we'll just simulate a successful response
    
    // Call on_step a few times to simulate progress
    if (options.on_step) {
      options.on_step({ text: 'Starting execution...' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      options.on_step({ text: 'Running commands...' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      options.on_step({ text: 'Checking results...' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Return a mock successful output
    return {
      output: {
        setup_success: true,
        success: true,
        notes: 'This is a simulated successful execution',
      },
    };
  }
}

export default {
  DigitalOceanClient,
  DigitalOceanScrapybaraClient,
};
